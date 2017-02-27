
import jwtDecode from 'jwt-decode';

export function getuser() {
    var jwt = localStorage.getItem('jwt');
    if(!jwt) return null;
    return jwtDecode(jwt);
}

//return original jwt
export function getjwt() {
    return localStorage.getItem('jwt');
}

//return fetch config with jwt token
export function getjwtheader() {
    return {
        headers: {
            Authorization: "Bearer "+localStorage.getItem("jwt"),
        },
        mode: "cors",
    }
}
