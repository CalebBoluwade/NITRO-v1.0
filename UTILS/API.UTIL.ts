import needle from "needle";

const options = {
  user_agent: "MyCustomUserAgent",
  headers: {
    Authorization: "Bearer my_token",
    "Content-Type": "application/json",
  },
  timeout: 5000,
  follow_max: 3,
  json: true,
};

const needleInstance = needle.get("", options);
