import {useLocation, useNavigate} from "react-router-dom";
import {useEffect} from "react";
import {useClientMe} from "@/hooks/profile/useClientMeQuery.ts";
import {saveAccessToken} from "@/utils/googleAuth.ts";

const AuthCallback = () => {
    const navigate = useNavigate();
    const location = useLocation();
    useEffect(() => {
        const params = new URLSearchParams(location.search)
        const code = params.get('code')
        const state = params.get('state')
        if(!state) {
            navigate('/')
        }
        saveAccessToken(state)
        // navigate('/profile/edit', {replace:true})
    }, []);
     const data = useClientMe()
    // if(data) {
    //     console.log('data')
    //     navigate("/profile/edit", { replace: true })
    // } else {
    //     navigate("/profile-setup", { replace: true });
    //
    // }
    return <div>redirect...</div>
}
export default AuthCallback;


