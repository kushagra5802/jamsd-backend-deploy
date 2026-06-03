class Responses {
  static successResponse(message, data) {
    return {
      status: true,
      message,
      data,
      error: null
    };
  }

  static errorResponse(error) {
    return {
      status: false,
      message: error?.message,
      data: null,
      error
    };
  }
}

module.exports = Responses;
