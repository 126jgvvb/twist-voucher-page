import { useState,useEffect } from "react";
import { ClientsList } from "../components/clientList";
import { HeaderSection } from "../components/headerSection";
import { ThemeToggle } from "../components/ThemeToggle";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { pingServer } from "../redux/defaultSlice";
import { getOnlineData } from "../redux/defaultSlice";

    const packageHeader=['package','Amount'];

    /*
    const amountList=[
    {
     name:'1 Day',
     amount:'ugx.1000'
    },
    {
        name:'2 Days',
        amount:'ugx.2500'
       },
       {
        name:'3 Days',
        amount:'ugx.5000'
       },
       {
        name:'7 Days',
        amount:'ugx.9000'
       },
       {
        name:'1 month',
        amount:'ugx.18000'
       }];
*/

const checkExpiredToken=()=>{
    let temp_token=null;
    const storeObj=localStorage.getItem('storeX');

    console.log('Checking for token validity');

    try{
    temp_token=JSON.parse(storeObj);
    }
    catch(e){
        console.log(`JSON error:${e}`);
    }
    finally{
    if(temp_token!=null ){
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
        console.log('No saved token was detected');
        return;
    }
}
}





export const Client=()=>{    
    const serverActive=useSelector((state)=>state.serverActive);
    const dispatch=useDispatch();
  
    checkExpiredToken();

    useEffect(()=>{
        dispatch(pingServer());
        if(serverActive){ dispatch(getOnlineData());}
  
    },[dispatch]);


    const amountList=useSelector(state=>state.reducerX.dynamicData.amountList);


        return <section className={" mx-2 justify-center mt-[10%] items-center space-y-3"} >
        <ThemeToggle/>
     
        <div className={"mx-auto  text-2xl container bg-card text-center "} >
        <h1 className={"font-bold p-4 text-1xl md:text-2xl "} >
                    <span className={"animate-fade-in "} >
                    Welcome to TWIST HUB
                    </span>
                </h1>
        </div>
    
        <div className={"container bg-card p-3 mx-auto text-center justify-center space-y-3"} >
        <h1 className={"font-bold p-4 text-1xl md:text-2xl "} >
                    <span className={"animate-fade-in "} >
                    This is a list of packages available.Please choose according to your needs
                    </span>
                </h1>

        <ClientsList headerList={packageHeader} list={amountList} />
        </div>
    </section>
    }