/* eslint-disable @typescript-eslint/no-explicit-any */
export interface ActionResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
}
