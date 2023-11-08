import { Request, Response, Router } from "express";
import { User } from "../entities/User";
import { isEmpty, validate } from "class-validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cookie from "cookie";

const mapError = (errors: Object[]) => {
  return errors.reduce((prev: any, err: any) => {
    prev[err.property] = Object.entries(err.constraints)[0][1];
    return prev;
  }, {});
};

//req: register에서 보낸 정보가 담겨있음
//res: req를 이용해 response를 보냄
const register = async (req: Request, res: Response) => {
  const { email, username, password } = req.body;

  try {
    let errors: any = {};

    //이메일과 유저이름이 이미 저장, 사용되고 있는 것인지 확인.
    const emailUser = await User.findOneBy({ email });
    const usernameUser = await User.findOneBy({ username });

    //이미 있다면 errors 객체에 넣어줌
    if (emailUser) errors.email = "이미 해당 이메일 주소가 사용되었습니다.";
    if (usernameUser) errors.username = "이미 이 사용자 이름이 사용되었습니다.";

    //에러가 있다면 return으로 에러를 response 보내줌.
    if (Object.keys(errors).length > 0) {
      return res.status(400).json(errors);
    }

    const user = new User();
    user.email = email;
    user.username = username;
    user.password = password;

    errors = await validate(user);
    //엔티티에 정해 놓은 조건으로 user 데이터의 유효성 검사
    if (errors.length > 0) return res.status(400).json(mapError(errors));
    //유저 정보를 user table에 저장.
    await user.save();

    return res.json(user);
  } catch (error) {
    console.log("register error");
    return res.status(500).json({ error });
  }
};

const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  try {
    let errors: any = {};

    //비워져있다면 에러를 프론트엔드로 보내주기

    if (isEmpty(username))
      errors.username = "사용자 이름은 비워둘 수 없습니다.";
    if (isEmpty(password)) errors.password = "비밀번호는 비워둘 수 없습니다.";

    if (Object.keys(errors).length > 0) {
      return res.status(400).json(errors);
    }

    // 디비에서 user 찾기
    const user = await User.findOneBy({ username });

    if (!user)
      return res
        .status(400)
        .json({ username: "사용자 이름이 등록되지 않았습니다." });

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      return res.status(401).json({ password: "비밀번호가 잘못되었습니다." });
    }

    const token = jwt.sign({ username }, process.env.JWT_SCERET);

    res.set(
      "Set-Cookie",
      cookie.serialize("token", token, {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      })
    );

    return res.json({ user, token });
  } catch (error) {
    console.error(error);
    return res.status(500).json(error);
  }
};
const router = Router();
router.post("/register", register); // /register라는 경로에서 오면, register handler 발동
router.post("/login", login);

export default router;
