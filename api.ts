import axios, { AxiosInstance, AxiosRequestConfig, Method } from 'axios';

interface TokenProps {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
}

interface UserProps {
    id: number;
    email: string;
    name?: string;
    city?: string;
}

const initialTokenState = {
    access_token: '',
    token_type: 'BEARER',
    expires_in: 0,
    refresh_token: '',
};

enum REQUEST_METHOD {
    GET = 'get',
    POST = 'post',
    PATCH = 'patch',
}

const getEnvVar = (name: string) => {
    const _name = `REACT_APP_${name}`;
    return String(process.env[_name] || '');
};

const OAUTH_URL = getEnvVar('OAUTH_URL');
const OAUTH_USERNAME = getEnvVar('OAUTH_USERNAME');
const OAUTH_PASSWORD = getEnvVar('OAUTH_PASSWORD');
const API_URL = getEnvVar('API_URL');


let isNewToken = false;
let invokedToken: TokenProps = initialTokenState;

// create axios instance
const axiosApiInstance: AxiosInstance = axios.create({ baseURL: API_URL, timeout: 10000 });

// request interseptor: set auth header
axiosApiInstance.interceptors.request.use(
    async (request) => {
        request.headers = {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        };
        if (invokedToken.access_token !== '') {
            request.headers.Authorization = `${invokedToken.token_type} ${invokedToken.access_token}`;
        }
        return request;
    },
    (error) => {
        Promise.reject(error);
    },
);
// response interseptor: refresh tokens
axiosApiInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.response.config;
        if (
            invokedToken.access_token !== '' &&
            !isNewToken &&
            error.response.status === 401 &&
            !originalRequest._retry
        ) {
            try {
                const _Token: TokenProps = await _refreshToken();
                originalRequest._retry = true;
                // update global variable 'invokedToken' cause used in request interceptor
                invokedToken = _Token;
                isNewToken = true;
                return axiosApiInstance(originalRequest);
            } catch (error) {
                return Promise.reject(error);
            }
        }
        return Promise.reject(error);
    },
);

const getQueryStringFromObject = (json: Record<string, string | number>) => {
    const str = Object.keys(json)
        .map(function (key) {
            return encodeURIComponent(key) + '=' + encodeURIComponent(json[key]);
        })
        .join('&');
    return str;
};

// refresh token oauth
const _refreshToken = async () => {
    const endPoint = `${OAUTH_URL}/token`;
    const _payload = {
        refresh_token: invokedToken.refresh_token,
        grant_type: 'refresh_token',
    };
    const payload = getQueryStringFromObject(_payload);
    const config: AxiosRequestConfig = {
        auth: {
            username: OAUTH_USERNAME,
            password: OAUTH_PASSWORD,
        },
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    };
    try {
        const response = await axios.post(endPoint, payload, config);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export interface ApiResponseType {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    responseData: any;
    newToken: TokenProps;
}

export default class Api {
    constructor(token?: TokenProps) {
        if (!isNewToken && token) {
            invokedToken = token;
        }
    }

    private _requestWrapper = async (
        endPoint: string,
        method: Method,
        data?: unknown,
        additionalConfig?: AxiosRequestConfig,
    ): Promise<ApiResponseType> => {
        try {
            const config: AxiosRequestConfig = { url: endPoint, method: method, ...additionalConfig };
            if (data) {
                config.data = data;
            }
            const response = await axiosApiInstance.request(config);
            return { responseData: response.data, newToken: isNewToken ? invokedToken : initialTokenState };
        } catch (error) {
            throw error.response;
        }
    };
      
    getUser = async (id: number) => {
        const endPoint = `/api/user/${id}`;
        return await this._requestWrapper(endPoint, REQUEST_METHOD.GET);
    };
      
    createUser = async (email: string, password: string) => {
        const endPoint = `/api/create/user`;
        const payload: {
            email: string;
            password: string;
        } = {
            email,
            password,
        };
        return await this._requestWrapper(endPoint, REQUEST_METHOD.POST, payload);
    };

    updateUser = async (user: UserProps) => {
        const endPoint = `/api/update/user/${user.id}`;
        return await this._requestWrapper(endPoint, REQUEST_METHOD.PATCH, user);
    };
}
