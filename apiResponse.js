const apiResponse = (res, status, message, data = null) => {
    return res.status(status).json({ status, message, data });
  };
  
  export default apiResponse;
  