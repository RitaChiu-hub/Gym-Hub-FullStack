const { getEnrollmentStatus } = require("./enrollment");

describe("getEnrollmentStatus", () => {
  test("returns 'enrolled' when there are open spots", () => {
    expect(getEnrollmentStatus(5, 20)).toBe("enrolled");
  });
  
  test("returns 'enrolled' when there are only one open spots", () => {
    expect(getEnrollmentStatus(19, 20)).toBe("enrolled");
  });

  test("returns 'waitlist' when there are no open spots", () => {
    expect(getEnrollmentStatus(20, 20)).toBe("waitlist");
  });

   test("returns 'waitlist' when capacity is 0", () => {
    expect(getEnrollmentStatus(0, 0)).toBe("waitlist");
  });
  
});