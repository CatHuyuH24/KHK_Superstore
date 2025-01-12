function validatePassword() {
    const passwordInput = document.getElementById('password');
    const conditions = {
        lowercase: document.getElementById('condition-lowercase'),
        uppercase: document.getElementById('condition-uppercase'),
        length: document.getElementById('condition-length'),
        validChars: document.getElementById('condition-valid-chars'),
    };
    const submitButton = document.querySelector('button[type="submit"]');

    const password = passwordInput.value;

    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const isValidLength = password.length >= 8 && password.length <= 16;
    const isValidChars = /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/.test(password);

    conditions.lowercase.style.color = hasLowercase ? 'green' : 'gray';
    conditions.uppercase.style.color = hasUppercase ? 'green' : 'gray';
    conditions.length.style.color = isValidLength ? 'green' : 'gray';
    conditions.validChars.style.color = isValidChars ? 'green' : 'gray';

    submitButton.disabled = !(hasLowercase && hasUppercase && isValidLength && isValidChars);
}
