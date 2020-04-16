

const isEmpty = (string) => {
    if(string.trim() === '') return true;
    else return false;
}
const isEmail = (email) => {
    const regEx =  /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if(email.match(regEx)) return true;
    else return false;
}

exports.validateSignUpData = (data) => {
    let errors = {};

    if(isEmpty(data.email)){
        errors.email = 'must not be empty'
    } else if(!isEmail(data.email)){
        errors.email = 'Must be a valid email address'
    }

    if(isEmpty(data.password)) errors.password = 'Must not empty'
    if(data.password !== data.confirmPassword) errors.confirmPassword = 'Passwords must match'
    if(isEmpty(data.handle)) errors.handle = 'Must not empty';

    return {
        errors,
        valid: Object.keys(errors).length === 0 ? true : false
    }

}

exports.validateLoginData = (data) => {
    let errors = {};
    if(isEmpty(data.email)) errors.email = 'must not be empty';
    if(isEmpty(data.password)) errors.password = 'must not be empty';
    return {
        errors,
        valid: Object.keys(errors).length === 0 ? true : false
    }
}