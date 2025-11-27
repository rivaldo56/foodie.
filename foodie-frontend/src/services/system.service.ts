import { apiRequest, ApiResponse } from '../lib/api';

export const systemService = {
    async checkHealth(): Promise<ApiResponse<{ status: string }>> {
        return apiRequest({ url: '/' });
    }
};

export const {
    checkHealth
} = systemService;
