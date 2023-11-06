import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./entities/User";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: "localhost",
  port: 5432,
  username: "postgres",
  password: "password",
  database: "postgres",
  synchronize: true, //서버를 실행할 때 마다 sync를 맞출것인지 t or f 여부, 운영환경에서는 f, 개발환경에서는 t
  logging: false,
  //   entities: [User], //하나씩 넣어도 되고 폴더를 넣어도 됨.
  entities: ["src/entities/**/*.ts"],
  migrations: [],
  subscribers: [],
});
