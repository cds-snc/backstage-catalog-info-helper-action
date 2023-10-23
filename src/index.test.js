"use strict";

// eslint-disable-next-line no-unused-vars
const core = require("@actions/core");
const { action } = require("./action.js");
const { when } = require("jest-when");
jest.mock("@actions/core");
jest.mock("./action.js", function () {
  return { action: jest.fn() };
});

describe("index.js", () => {
  test("calls action if resolved", async () => {
    when(action).calledWith().mockResolvedValue();

    await action();
    expect(action).toBeCalled();
  });

  test("calls throws error if rejects", async () => {
    const err = "unhandledRejection";
    when(action).calledWith().mockRejectedValue(err);
    await expect(action()).rejects.toEqual(err);
  });

});
