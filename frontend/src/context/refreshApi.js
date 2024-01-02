import axios from 'axios'
import {createRefresh} from 'react-auth-kit'

const refreshApi = createRefresh({
    interval: 3,   // Refreshs the token in every 4 minutes
    refreshApiCallback: async (
      {   
        authToken,
        refreshToken,
      }) => {
      try {
        const response = await axios.post("http://localhost:8000/api/token/refresh/", {'refresh': refreshToken}, {
          headers: {'Authorization': `Bearer ${authToken}`}}
        )
        return {
          isSuccess: true,
          newAuthToken: response.data.access,
          newRefreshToken: response.data.refresh,
          newAuthTokenExpireIn: 5,
          newRefreshTokenExpiresIn: 89 * 24 * 60
        }
      }
      catch(error){
        console.error(error)
        return {
          isSuccess: false
        } 
      }    
    }
  })
  
  export default refreshApi