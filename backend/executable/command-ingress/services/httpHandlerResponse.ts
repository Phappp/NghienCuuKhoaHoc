import { Response } from "express";
import { ServiceResponse } from "./serviceResponse";

// export const handleServiceResponse = (
//   serviceResponse: ServiceResponse<any>,
//   response: Response
// ) => {
//   return response.status(serviceResponse.code).send(serviceResponse);
// };


export const handleServiceResponse = (
  serviceResponse: ServiceResponse<any>,
  response: Response,
) => {
  // Kiểm tra xem nếu là lỗi thì trả về mã lỗi và thông báo lỗi
  if (serviceResponse.success === false) {
    return response.status(serviceResponse.code).json({
      status: 'Failed',
      message: serviceResponse.message,
    });
  }

  // Nếu không có lỗi, trả về mã thành công và dữ liệu
  return response.status(serviceResponse.code).json({
    status: 'Success',
    data: serviceResponse.data,
  });
};