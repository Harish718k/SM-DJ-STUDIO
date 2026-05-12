exports.successResponse = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

exports.errorResponse = (res, message = 'Server Error', statusCode = 500, errors = null) => {
  const response = { success: false, message };
  if (errors) response.errors = errors;
  return res.status(statusCode).json(response);
};

exports.paginatedResponse = (res, data, total, page, limit) => {
  return res.status(200).json({
    success: true,
    count: data.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit),
    data
  });
};
