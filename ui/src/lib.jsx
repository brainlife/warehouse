
import jwtDecode from 'jwt-decode';

//return original jwt
export function getjwt() {
    return localStorage.getItem('jwt');
}

export function user() {
    var jwt = getjwt();
    if(!jwt) return null;
    var token = jwtDecode(jwt);
    //TODO - check for expiration?
    return token;
}

//return fetch config with jwt token
export function jwtheader() {
    return {
        headers: {
            Authorization: "Bearer "+localStorage.getItem("jwt"),
        },
        mode: "cors",
    }
}
