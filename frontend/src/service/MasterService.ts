import { ISearch } from 'components/filters/SearchFilter';
import { dispatch } from 'store';
import { closeBackdrop, openBackdrop } from 'store/reducers/backdropSlice';
import { openSnackbar } from 'store/reducers/snackbar';
import { IApiResponse } from 'types/types.services';
import axiosServices from 'utils/axios';

export type TEmployeeReport = {
  reportid: string;
  reportname: string;
};

class MasterService {
  getAllEmployeeReports = async (): Promise<TEmployeeReport[]> => {
    return [];
  };

  getMasters = async (
    app_code: string,
    master: string,
    paginationData?: { page: number; rowsPerPage: number },
    searchData?: ISearch | null,
    code?: string | null,
    code2?: string | null,
    additionalParams?: Record<string, any>
  ) => {
    try {
      dispatch(openBackdrop());
      const page = paginationData && paginationData.page + 1;
      const limit = paginationData && paginationData.rowsPerPage;
      const response: IApiResponse<{ tableData: unknown[]; count: number }> = await axiosServices.get(
        `api/${app_code}/${master}?code=${code}&code2=${code2}`,
        {
          params: {
            ...(page && { page }),
            ...(limit && { limit }),
            ...(searchData && { filter: JSON.stringify(searchData) }),
            ...(additionalParams && additionalParams)
          }
        }
      );

      dispatch(closeBackdrop());
      if (response.data.success) return response.data.data;
    } catch (error: unknown) {
      dispatch(closeBackdrop());
      const knownError = error as { message: string };
      dispatch(
        openSnackbar({
          open: true,
          message: knownError.message,
          variant: 'alert',
          alert: { color: 'error' },
          severity: 'error',
          close: true
        })
      );
    }
  };
}

const MasterServiceInstance = new MasterService();
export default MasterServiceInstance;
