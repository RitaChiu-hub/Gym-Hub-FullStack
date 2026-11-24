function getEnrollmentStatus(enrolledCount, capacity) {
  return enrolledCount < capacity ? "enrolled" : "waitlist";
}

module.exports = { getEnrollmentStatus };