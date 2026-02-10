import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { pingServer, getOnlineData } from "../redux/defaultSlice";
import { ClientsList } from "../components/clientList";
import { WifiHigh } from "phosphor-react";
import { LucideLoaderPinwheel } from "lucide-react";





export const Client = () => {
  const serverActive = useSelector((state) => state.serverActive);
  const dispatch = useDispatch();
  const storeObj=localStorage.getItem('storeX');
  let temp_token=null;

  let [time,setSeconds]=useState(10);
  const text1=`Attempting reconnection in ${time},please wait... `;
  const text2='You can try refreshing this page';
  let [loaderVisible,setVisibility]=useState(true);
  let [changeText,setChangeText]=useState(false);


  const checkExpiredToken=()=>{
    console.log('Checking for token validity');
  
    try{
    temp_token=JSON.parse(storeObj);
    }
    catch(e){
        console.log(`JSON error:${e}`);
    }
    finally{
    if(temp_token!=null ){
      setVisibility(true);
      
        let params=new URLSearchParams();
        params.append('clientMac',temp_token.clientMac);
        params.append('token',temp_token.token);
        params.append('username','testuser');
        params.append('password',temp_token.token);
        params.append('operation','login');
        params.append('origUrl','http://www.msftconnecttest.com/redirect');
  
  
        const eapIP=new URLSearchParams(window.location.search).get('eapIP');  //eapIP
  
        console.log('retrieved token:',temp_token.token);
  
     try{
         fetch(`http://${eapIP}:22080/portal/portal_entry.json`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: params.toString(),
                    })
                    .then((result)=>{
                        return result.json();
                    })
                    .then((result)=>{
                        console.log('Response from radius:',Object.keys(result));
                        return true;
                    })
     }  
     catch(e){
        console.log('Error while preprocessing token:',e);
     } 
    }
    else{
        setVisibility(false);
        console.log('No saved token was detected');
        return;
    }
  }
  }


    
  
  useEffect(() => {
    dispatch(pingServer());
    if (serverActive) dispatch(getOnlineData());
    checkExpiredToken();

    const scheduler=setInterval(()=>{
      console.log(time);
 //     if(time>0) setSeconds(time--);
      setSeconds((prevTime)=>{
        if(prevTime>0){
            return prevTime-1;
        }
        else{
          clearInterval(scheduler);
          setChangeText(true);
        }
      })
    },1000);


    return ()=>clearInterval(scheduler);
  }, [dispatch, serverActive]);



  const packageHeader = ["Package", "Amount"];
  const amountList = [
    { name: "6 Hrs", amount: "UGX 500" },
    { name: "12 Hrs", amount: "UGX 700" },
    { name: "24 Hrs", amount: "UGX 1000" },
    { name: "1 Week", amount: "UGX 5000" },
    { name: "1 Month", amount: "UGX 20000" },
  ];

  return (
    <section className="min-h-screen flex flex-col items-center justify-start py-10 bg-gradient-to-b from-blue-100 to-white text-center space-y-10">
      <div className="flex flex-col items-center space-y-3">
        <WifiHigh size={48} className="text-blue-600 animate-pulse" />
        <h1 className="text-3xl md:text-4xl font-bold text-blue-800">
          Masters WiFi Lusalira
        </h1>
        <p className="text-blue-500">
          Choose your preferred internet package below
        </p>
      </div>

      {
        loaderVisible && <div className="justify-center items-center text-blue flex space-x-3">
           { (!changeText) ?
             <div className="flex space-x-3">
            <LucideLoaderPinwheel className="animate-spin " size={25} color="blue" />
            <label>{`${text1} `}</label>
            </div> :
            
             <label>{text2}</label>
           }
             </div>
      }

      <ClientsList headerList={packageHeader} list={amountList} />

      <footer className="text-center text-sm text-gray-500 mt-8">
        <p>Contact: 0741882818 | masterswifi@lusalira.com</p>
        <p>© {new Date().getFullYear()} Masters WiFi Lusalira</p>
      </footer>
    </section>
  );
};
