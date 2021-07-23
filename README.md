# react-axios-interceptors
How to use axios request and response interceptors in react to send an http authorization header and refresh expired token

Using:

    import Api, { ApiResponseType, TokenProps, UserProps, initialTokenState } from './api';
    let token: TokenProps = {
        access_token: 'xxxxxxxxxx',
        token_type: 'BEARER',
        expires_in: 3600,
        refresh_token: 'yyyyyyyyyy',
    };
    const ProtectedApi = new Api(token);
    try {
        let response: ApiResponseType = { responseData: null, newToken: initialTokenState };
        
        // example 1: get data for user with id = 10
        response = await ProtectedApi.getUser(10);
        if (response.newToken.access_token !== '') {
            token = response.newToken;
        }
        console.log(response.responseData);
        
        // example 2: create user
        response = await ProtectedApi.createUser('user@test.de', 'xxxxx');
        if (response.newToken.access_token !== '') {
            token = response.newToken;
        }
        console.log(response.responseData);
        
        // example 3: update user
        const user: UserProps = {
            id: 10,
            name: 'Alex',
            city: 'Berlin',
        };
        response = await ProtectedApi.updateUser(user);
        if (response.newToken.access_token !== '') {
            token = response.newToken;
        }
        console.log(response.responseData);
        
    }  catch (error) {
        console.log(error.message);
    }
