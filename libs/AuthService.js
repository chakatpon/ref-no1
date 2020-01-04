import localStorage from 'local-storage';
export default class AuthService {
    constructor(domain) {
      this.domain = process.env.APP_DOMAIN || domain || 'http://localhost:3000'
      this.getProfile = this.getProfile.bind(this)
      //this.call_profile();
    }
    getProfileAwait() {
      
      return this.fetch(`${this.domain}/user`, {
        method: 'get',
      })
    }
    getMeAwait() {
      
      return this.fetch(`${this.domain}/api/info/me`, {
        method: 'get',
      })
    }
    call_profile() {
        if(localStorage.get('profile')){
            return ;
        }
      // Get a token
      return this.fetch(`${this.domain}/user`, {
        method: 'get',
      }).then(res => {
        if(res.error){
          Promise.error(res.error)
          return 
        }
        this.setProfile(res)
        return Promise.resolve(res)
      }).catch(err=>{

      })
    }
  
    loggedIn(){
      // Checks if there is a saved token and it's still valid
      const token = this.getToken()
      return !!token // handwaiving here
    }
  
    setProfile(profile){
      // Saves profile data to localStorage
      localStorage.set('profile', JSON.stringify(profile))
    }
  
    getProfile(){
      // Retrieves the profile data from localStorage
      const profile = localStorage.get('profile')
      return profile ? JSON.parse(profile) : this.call_profile();
    }
  
    setToken(idToken){
      // Saves user token to localStorage
      localStorage.set('id_token', idToken)
    }
  
    getToken(){
      // Retrieves the user token from localStorage
      
      return localStorage.get('id_token')
    }
  
    logout(){
      // Clear user token and profile data from localStorage
      localStorage.removeItem('id_token');
      localStorage.removeItem('profile');
    }
  
    _checkStatus(response) {
      // raises an error in case response status is not a success
      if (response.status >= 200 && response.status < 300) {
        return response
      } else {
        return null
      }
    }
  
    fetch(url, options){
      // performs api calls sending the required authentication headers
      const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
  
      if (this.loggedIn()){
        headers['Authorization'] = 'Bearer ' + this.getToken()
      }
  
      return fetch(url, {
        headers,
        ...options
      })
      .then(response => response.json())
    }
  }