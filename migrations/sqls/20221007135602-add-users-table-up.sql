CREATE TABLE user_privileges (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(255) UNIQUE
);

CREATE INDEX user_privileges_name_index ON user_privileges(name);

INSERT INTO user_privileges (name) VALUES ('admin');
INSERT INTO user_privileges (name) VALUES ('user');

CREATE TABLE users (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  login VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE DEFAULT NULL,
  name VARCHAR(255),
  privilege INT REFERENCES user_privileges(id),
  password VARCHAR(2047) NOT NULL,
  deleted BOOLEAN NOT NULL DEFAULT false,
  "tokenId" VARCHAR(36) DEFAULT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NULL,
  "deletedAt" TIMESTAMPTZ DEFAULT NULL
);

CREATE VIEW users_with_privilege_name AS
  SELECT users.*,
    (SELECT name FROM user_privileges AS p WHERE users.privilege = p.id) AS "privilegeName"
  FROM users;

CREATE INDEX users_login_index ON users(login);
CREATE INDEX users_email_index ON users(email);

CREATE TRIGGER on_users_update
BEFORE UPDATE OR DELETE
ON users
FOR EACH ROW
EXECUTE FUNCTION on_update();
