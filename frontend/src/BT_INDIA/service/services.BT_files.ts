import { dispatch } from 'store';
import { openSnackbar } from 'store/reducers/snackbar';
import { IApiResponse } from 'types/types.services';
import axiosServices from 'utils/axios';

class BTFileUploadService {

  uploadEmployeeAttachment = async (file: Blob | File, request_number: string, type: string) => {
    try {
      const chatFileUpload = new FormData();
      chatFileUpload.append(`file`, file);
      chatFileUpload.append('request_number', request_number);
      chatFileUpload.append('type', type);
      chatFileUpload.append('modules', 'vendor'); // Always pass modules=vendor

      const response: IApiResponse<any> = await axiosServices.post('api/files/uploadEmployeeAttachment', chatFileUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response) {
        dispatch(
          openSnackbar({
            open: true,
            message: `Uploaded successfully`,
            variant: 'alert',
            alert: {
              color: 'success'
            },
            close: true
          })
        );
        return response.data;
      }
    } catch (error) {
      dispatch(
        openSnackbar({
          open: true,
          message: `The media was not uploaded.`,
          variant: 'alert',
          alert: {
            color: 'error'
          },
          close: true
        })
      );
    }
  };

  getEmployeeFiles = async (request_number: string, modules: string = 'hr') => {
    try {
      console.log('Request Params:', { request_number, modules });

      const encodedRequestNumber = encodeURIComponent(request_number);

      const response: IApiResponse<any> = await axiosServices.get(`api/files/BTemployees/${encodedRequestNumber}?modules=${modules}`);

      if (response) {
        return response.data.data;
      }
    } catch (error) {
      dispatch(
        openSnackbar({
          open: true,
          message: error,
          variant: 'alert',
          alert: {
            color: 'error'
          },
          close: true
        })
      );
    }
  };

  editEmployeeFile = async (aws_file_locn: string, user_file_name: string, request_number: string) => {
    try {
      const response: IApiResponse<any> = await axiosServices.put(`api/files/BTeditEmployeeFile`, {
        aws_file_locn,
        user_file_name,
        request_number // Include request_number in the payload
      });
      if (response) {
        return response.data.data;
      }
    } catch (error) {
      dispatch(
        openSnackbar({
          open: true,
          message: error,
          variant: 'alert',
          alert: {
            color: 'error'
          },
          close: true
        })
      );
    }
  };

  deleteEmployeeAttachment = async (request_number: string, sr_no: number) => {
    try {
      const response: IApiResponse<any> = await axiosServices.delete(`api/files/BTdeleteEmployeeFiles/${request_number}/${sr_no}`);
      if (response) {
        dispatch(
          openSnackbar({
            open: true,
            message: `File deleted successfully.`,
            variant: 'alert',
            alert: {
              color: 'success'
            },
            close: true
          })
        );
        return response.data;
      }
    } catch (error) {
      dispatch(
        openSnackbar({
          open: true,
          message: `Failed to delete the file.`,
          variant: 'alert',
          alert: {
            color: 'error'
          },
          close: true
        })
      );
    }
  };
}

const BTFileUploadServiceInstance = new BTFileUploadService();
export default BTFileUploadServiceInstance;
