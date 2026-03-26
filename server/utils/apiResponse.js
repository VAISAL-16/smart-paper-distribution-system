export const sendSuccess = (res, data = {}, message = "OK", statusCode = 200) =>
  res.status(statusCode).json({
    success: true,
    message,
    data,
    requestId: res.locals.requestId
  });

export const sendList = (res, items = [], meta = {}, message = "OK", statusCode = 200) =>
  res.status(statusCode).json({
    success: true,
    message,
    data: items,
    meta,
    requestId: res.locals.requestId
  });
