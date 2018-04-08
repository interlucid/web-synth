export const webAuth = new auth0.WebAuth({
    domain: 'interlucid.auth0.com',
    clientID: '4aQ28QeHCkVUYCgIP9kvZAAS0Pb381Gp',
    responseType: 'token id_token',
    audience: '/api',
    scope: 'openid profile',
    redirectUri: window.location.href
});

export const handleAuthentication = (template) => {
    webAuth.parseHash((err, authResult) => {
        if (authResult && authResult.accessToken && authResult.idToken) {
            window.location.hash = '';
            setSession(authResult);
        } else if (err) {
            console.log(err);
            alert('Error: ' + err.error + '. Check the console for further details.');
        }
        // update the template that requested the auth
        template.invalidate();
        // tell the template to update as necessary
        template.authCallback();
    });
}

export const setSession = (authResult) => {
    // Set the time that the Access Token will expire at
    const expiresAt = JSON.stringify(
        authResult.expiresIn * 1000 + new Date().getTime()
    );
    localStorage.setItem('access_token', authResult.accessToken);
    localStorage.setItem('id_token', authResult.idToken);
    localStorage.setItem('expires_at', expiresAt);
}

export const login = () => {
    webAuth.authorize();
}

export const logout = (template) => {
    // Remove tokens and expiry time from localStorage
    localStorage.removeItem('access_token');
    localStorage.removeItem('id_token');
    localStorage.removeItem('expires_at');
    template.invalidate();
}

export const isAuthenticated = () => {
    // Check whether the current time is past the
    // Access Token's expiry time
    const expiresAt = JSON.parse(localStorage.getItem('expires_at'));
    return new Date().getTime() < expiresAt;
}

let userProfile;

export const getProfile = (template) => {
    // if there's no user profile, fetch it
    if(!userProfile) {
        const accessToken = localStorage.getItem('access_token');
    
        // access token must exist to fetch profile
        if(!accessToken) {
            return;
        }
    
        // only get the profile if authenticated
        if(isAuthenticated()) {
            webAuth.client.userInfo(accessToken, (err, profile) => {
                userProfile = profile;
                template.updateProfile(userProfile);
            });
        }
    } else {
        console.log('displaying profile?', userProfile);
        template.updateProfile(userProfile);
    }
}