import { useState } from "react";
import { CircleNotch } from "phosphor-react";
import { networkObject } from "../pages/network";

export const ClientsList = ({ headerList, list }) => {
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);

  const HandleLogin = async (id) => {
    const input = document.getElementById(id).value.trim();
    if (!input || /[+#$%@!*-]/.test(input)) {
      alert("Invalid voucher code.");
      return;
    }
    setLoading(true);
    const connectionID = new URLSearchParams(window.location.search).get("connectionID");
    const eapIP = new URLSearchParams(window.location.search).get("eapIP");
    const ghostUser = localStorage.getItem("ghost-user");

    try {
      const result = await networkObject.sendLogin({
        voucher: input,
        connectionID,
        ghostUser,
        ip: "192.168.43.122",
      });
      if (result?.data?.status === 200) {
        alert("Login successful!");
        //incasen power goes off and the ap looses the clients,each client can resend this code
        localStorage.setItem("storeX", JSON.stringify({ clientMac: result.data.clientMac, token: input }));
      //  window.location.href = `http://${eapIP}:22080/portal/portal_entry.json`;
      localStorage.setItem('ghost-user',result.data.clientID);
      console.log('polling radius...');

      
let params=new URLSearchParams();
params.append('clientMac',result.data.clientMac);
params.append('username','testuser');
params.append('password','testpw');
params.append('token',null);
params.append('operation','login');
params.append('origUrl','http://www.msftconnecttest.com/redirect');

console.log('ClientMac:',result.data.clientMac);
console.log('origUrl:',result.data.origUrl); 
    
    
    
await fetch(`http://${eapIP}:22080/portal/portal_entry.json`,
  {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
  })
  .then(async(result)=>{
    console.log('radius has responded with:',JSON.stringify(result));

      let m=await result.text();
      console.log('radius errr:',m);           
     return result.json()
})
          
          .catch(err=>{
              console.error(err);
              return false;
          });   
    } 
    else alert("Login failed. Check voucher and try again.");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };



  const Handle_ReLogin = async (id) => {
    const input = document.getElementById(id).value.trim();
    if (!input || /[+#$%@!*-]/.test(input)) {
      alert("Invalid voucher code.");
      return;
    }
    setLoading(true);
    const connectionID = new URLSearchParams(window.location.search).get("connectionID");
    const eapIP = new URLSearchParams(window.location.search).get("eapIP");
    const ghostUser = localStorage.getItem("ghost-user");

    try {
      const result = await networkObject.sendReLogin({
        voucher: input
      });
      if (result?.status === 200) {
        alert("Login successful!");
        //incasen power goes off and the ap looses the clients,each client can resend this code
        localStorage.setItem("storeX", JSON.stringify({ clientMac: result.clientMac, token: input }));
      //  window.location.href = `http://${eapIP}:22080/portal/portal_entry.json`;
      localStorage.setItem('ghost-user',"_blank");
      console.log('polling radius...');

      
let params=new URLSearchParams();
params.append('clientMac',result.clientMac);
params.append('username','testuser');
params.append('password','testpw');
params.append('token',null);
params.append('operation','login');
params.append('origUrl','http://www.msftconnecttest.com/redirect');

console.log('ClientMac:',result.clientMac); 
    
await fetch(`http://${eapIP}:22080/portal/portal_entry.json`,
  {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
  })
  .then(async(result)=>{
    console.log('radius has responded with:',JSON.stringify(result));

      let m=await result.text();
      console.log('radius errr:',m);           
     return result.json()
})
          
          .catch(err=>{
              console.error(err);
              return false;
          });   
    } 
    else alert("Login failed. Check voucher and try again.");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white bg-hero shadow-lg rounded-2xl px-6 py-10 max-w-lg w-full mx-auto border border-blue-100">
      <h2 className="text-blue-700 font-semibold text-white text-lg mb-6">Available Packages</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {list.map((item, idx) => (
          <div
            key={idx}
            onClick={() => setSelected(idx)}
            className={`p-4 rounded-xl cursor-pointer border transition-all duration-300 transform ${
              selected === idx
                ? "bg-blue-600 text-white shadow-xl scale-105"
                : "bg-blue-50 text-blue-800 hover:shadow-md hover:scale-105"
            }`}
          >
            <p className="font-semibold">{item.name}</p>
            <p className="text-lg font-bold">{item.amount}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex text-white flex-col space-y-3">
        <input
          id="token-id"
          type="text"
          placeholder="Enter voucher code"
          className="border rounded-full px-4 py-2 text-center focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          onClick={() => HandleLogin("token-id")}
          className="bg-blue-600 text-white rounded-full py-2 font-semibold hover:bg-blue-700 transition-all duration-300 flex justify-center items-center"
        >
          {loading ? <CircleNotch size={20} className="animate-spin" /> : "Connect"}
        </button>

            <p>You previously connected?</p>
            <h2 style={{'color':'yellow'}} >Re-Enter voucher </h2>
            <div className="mt-8 flex text-white flex-col space-y-3">
        <input
          id="token-id-2"
          type="text"
          placeholder="Re-Enter voucher code"
          className="border rounded-full px-4 py-2 text-center focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          onClick={() => Handle_ReLogin("token-id-2")}
          className="bg-yellow-600 text-white rounded-full py-2 font-semibold hover:bg-yellow-700 transition-all duration-300 flex justify-center items-center"
        >
          {loading ? <CircleNotch size={20} className="animate-spin" /> : "Re-Connect"}
        </button>
      </div>

      </div>
    </div>
  );
};
