import { useState, useEffect } from "react";
import { CircleNotch, WifiHigh, Phone, Copy } from "phosphor-react";
import { LucideLoaderPinwheel } from "lucide-react";
import { networkObject } from "./network";
import logo from "../assets/logo.jpg";

export const TwistNet = () => {
  const [selectedPackage, setSelectedPackage] = useState(2); // Default to 24 Hrs
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [voucher, setVoucher] = useState("");
  const [showVoucher, setShowVoucher] = useState(false);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Token check state variables
  const storeObj = localStorage.getItem('storeX');
  let temp_token = null;
  const [time, setSeconds] = useState(10);
  const text1 = `Attempting reconnection in ${time}, please wait... `;
  const text2 = 'You can try refreshing this page';
  const [loaderVisible, setVisibility] = useState(true);
  const [changeText, setChangeText] = useState(false);

  const checkExpiredToken = () => {
    console.log('Checking for token validity');
  
    try {
      temp_token = JSON.parse(storeObj);
    } catch (e) {
      console.log(`JSON error:${e}`);
    } finally {
      if (temp_token != null) {
        setVisibility(true);
        
        let params = new URLSearchParams();
        params.append('clientMac', temp_token.clientMac);
        params.append('token', temp_token.token);
        params.append('username', 'testuser');
        params.append('password', temp_token.token);
        params.append('operation', 'login');
        params.append('origUrl', 'http://www.msftconnecttest.com/redirect');
  
        const eapIP = new URLSearchParams(window.location.search).get('eapIP');
  
        console.log('retrieved token:', temp_token.token);
  
        try {
          fetch(`http://${eapIP}:22080/portal/portal_entry.json`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: params.toString(),
            })
            .then((result) => {
              return result.json();
            })
            .then((result) => {
              console.log('Response from radius:', Object.keys(result));
              return true;
            });
        } catch (e) {
          console.log('Error while preprocessing token:', e);
        }
      } else {
        setVisibility(false);
        console.log('No saved token was detected');
        return;
      }
    }
  };

  const hotlineNumber = new URLSearchParams(window.location.search).get("hotline") || "0741882818";

  useEffect(() => {
    checkExpiredToken();

    const scheduler = setInterval(() => {
      setSeconds((prevTime) => {
        if (prevTime > 0) {
          return prevTime - 1;
        } else {
          clearInterval(scheduler);
          setChangeText(true);
        }
      });
    }, 1000);

    return () => clearInterval(scheduler);
  }, []);
  const eapIP = new URLSearchParams(window.location.search).get("eapIP");
  const connectionID = new URLSearchParams(window.location.search).get("connectionID");
  const ghostUser = localStorage.getItem("ghost-user");

  const packages = [
    { name: "6 Hrs", amount: "UGX 500", price: 500 },
    { name: "12 Hrs", amount: "UGX 700", price: 700 },
    { name: "24 Hrs", amount: "UGX 1,000", price: 1000 },
    { name: "1 Week", amount: "UGX 5,000", price: 5000 },
    { name: "1 Month", amount: "UGX 20,000", price: 20000 }
  ];

  const handlePayAndConnect = async () => {
    if (!phoneNumber || !/^07\d{8}$/.test(phoneNumber.replace(/\s/g, ""))) {
      alert("Please enter a valid phone number (07XX XXX XXX)");
      return;
    }

    setLoading(true);
    setShowVoucher(false);

    try {
      const result = await networkObject.sendPhoneNumber({
        phoneNumber: phoneNumber.replace(/\s/g, ""),
        selectedPrice: packages[selectedPackage].price,
        ghostUser,
        ip: eapIP,
        reSellerPhoneNumber:hotlineNumber
      });

      if (result?.status === 200 && result.code!=null) {
        setVoucher(result.code);
        setShowVoucher(true);
        
        // Automatically connect using the voucher
        await connectWithVoucher(result.code);
      } else {
        alert("Payment failed. Please try again.");
      }
    } catch (error) {
      console.error(error);
      alert("Payment failed. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  };

  const connectWithVoucher = async (voucherCode) => {
    setVoucherLoading(true);

    try {
      const result = await networkObject.sendLogin({
        voucher: voucherCode,
        connectionID,
        ghostUser,
        ip: "192.168.43.122"
      });

      if (result?.data?.status === 200) {
        localStorage.setItem("storeX", JSON.stringify({ 
          clientMac: result.data.clientMac, 
          token: voucherCode 
        }));
        localStorage.setItem('ghost-user', result.data.clientID);

        // Call EAP hardware to connect
        const params = new URLSearchParams();
        params.append('clientMac', result.data.clientMac);
        params.append('username', 'testuser');
        params.append('password', 'testpw');
        params.append('token', null);
        params.append('operation', 'login');
        params.append('origUrl', 'http://www.msftconnecttest.com/redirect');

        await fetch(`http://${eapIP}:22080/portal/portal_entry.json`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString(),
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setVoucherLoading(false);
    }
  };

  const handleVoucherConnect = async () => {
    const input = document.getElementById("voucher-input").value.trim();
    if (!input) {
      alert("Please enter a voucher code");
      return;
    }

    await connectWithVoucher(input);
  };

  const copyVoucher = () => {
    navigator.clipboard.writeText(voucher);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReLogin = async (id) => {
    const input = document.getElementById(id).value.trim();
    if (!input || /[+#$%@!*-]/.test(input)) {
      alert("Invalid voucher code.");
      return;
    }

    setVoucherLoading(true);
    const eapIP = new URLSearchParams(window.location.search).get("eapIP");

    try {
      const result = await networkObject.sendReLogin({
        voucher: input
      });

      if (result?.status === 200) {
        alert("Login successful!");
        localStorage.setItem("storeX", JSON.stringify({ 
          clientMac: result.clientMac, 
          token: input 
        }));
        localStorage.setItem('ghost-user', "_blank");

        const params = new URLSearchParams();
        params.append('clientMac', result.clientMac);
        params.append('username', 'testuser');
        params.append('password', 'testpw');
        params.append('token', null);
        params.append('operation', 'login');
        params.append('origUrl', 'http://www.msftconnecttest.com/redirect');

        await fetch(`http://${eapIP}:22080/portal/portal_entry.json`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString(),
        });
      } else {
        alert("Login failed. Check voucher and try again.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setVoucherLoading(false);
    }
  };

  return (
    <section className="min-h-screen flex flex-col items-center justify-start py-10 bg-gradient-to-b from-red-600 via-purple-600 to-blue-600 text-white text-center space-y-10">
      {/* Header */}
      <div className="flex flex-col items-center space-y-3">
        <div className="bg-white/20 rounded-full p-4 backdrop-blur-sm">
          <WifiHigh size={48} className="text-white animate-pulse" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold">
          TwistNet
        </h1>
        <p className="text-lg opacity-90">
          from chargedMatrix
        </p>
        <p className="text-gray-200 max-w-md">
          Choose your preferred internet package below
        </p>
      </div>

      {
        loaderVisible && <div className="justify-center items-center text-white flex space-x-3">
           { (!changeText) ?
             <div className="flex space-x-3">
             <LucideLoaderPinwheel className="animate-spin " size={25} color="white" />
             <label>{`${text1} `}</label>
             </div> :
             
             <label>{text2}</label>
           }
             </div>
      }

      {/* Packages */}
      <div className="w-full max-w-lg px-4">
        <h2 className="text-xl font-semibold mb-6 text-left">AVAILABLE PACKAGES</h2>
        <div className="grid grid-cols-2 gap-4 mb-8">
          {packages.map((pkg, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedPackage(idx)}
              className={`p-4 rounded-2xl cursor-pointer border-2 transition-all duration-300 transform ${
                selectedPackage === idx
                  ? "bg-blue-600 text-white shadow-2xl scale-105 border-white"
                  : "bg-white/10 text-white hover:bg-white/20 hover:shadow-lg border-white/30"
              }`}
            >
              <p className="font-semibold">{pkg.name}</p>
              <p className="text-lg font-bold">{pkg.amount}</p>
              {selectedPackage === idx && (
                <div className="absolute top-2 right-2 bg-white text-blue-600 rounded-full p-1">
                  <div className="w-4 h-4 flex items-center justify-center">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Money Payment */}
      <div className="w-full max-w-lg px-4">
        <div className="relative bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/20 overflow-hidden">
            {/* Background Image */}
             <div 
               className="absolute inset-0 bg-cover bg-center"
               style={{ 
                 backgroundImage: `url(${logo})`,
                 opacity: 1
               }}
             />
            {/* Content Container - to ensure content is above background */}
            <div className="relative z-10">
              <h3 className="text-xl font-semibold mb-4 text-left">
                <Phone size={24} className="inline-block mr-2" />
                Pay with Mobile Money
              </h3>
           
           <div className="space-y-4">
             <div className="text-left">
               <label className="block text-sm font-medium text-gray-200 mb-1">Phone Number</label>
               <div className="relative">
                 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                   <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                   </svg>
                 </div>
                 <input
                   type="tel"
                   value={phoneNumber}
                   onChange={(e) => setPhoneNumber(e.target.value)}
                   placeholder="07XX XXX XXX"
                   className="block w-full pl-12 pr-4 py-3 bg-black/80 border border-white/30 rounded-2xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white"
                 />
               </div>
             </div>

             <button
               onClick={handlePayAndConnect}
               disabled={loading}
               className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white font-semibold py-3 px-4 rounded-2xl transition-all duration-300 flex justify-center items-center space-x-2"
             >
               {loading ? (
                 <>
                   <CircleNotch size={20} className="animate-spin" />
                   <span>Connecting...</span>
                 </>
               ) : (
                 <>
                   <span>Pay & Connect</span>
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                   </svg>
                 </>
               )}
             </button>
           </div>
            </div> {/* Closing content container */}
        </div>
      </div>
      

      {/* Voucher Section (Only visible when payment is successful) */}
      {showVoucher && (
        <div className="w-full max-w-lg px-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/20">
            <h3 className="text-xl font-semibold mb-4">Your Voucher Code</h3>
            
            <div className="space-y-4">
              <div className="bg-white/5 border-2 border-dashed border-white/30 rounded-2xl p-4">
                <p className="text-2xl font-bold tracking-wider">{voucher}</p>
              </div>

              <button
                onClick={copyVoucher}
                className="w-full bg-white/20 hover:bg-white/30 text-white font-semibold py-3 px-4 rounded-2xl transition-all duration-300 flex justify-center items-center space-x-2"
              >
                <Copy size={20} />
                <span>{copied ? "Copied!" : "Copy Voucher Code"}</span>
              </button>

              <p className="text-sm text-gray-200">
                Use this code for mobile money transactions
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Voucher Input Section */}
      <div className="w-full max-w-lg px-4">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/20"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-gradient-to-b from-purple-600 to-blue-600 text-white/80">
              OR USE A VOUCHER
            </span>
          </div>
        </div>

        <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/20">
          <div className="space-y-4">
            <div className="text-left">
              <label className="block text-sm font-medium text-gray-200 mb-1">Voucher Code</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="voucher-input"
                  type="text"
                  placeholder="Enter code here"
                  className="block w-full pl-12 pr-4 py-3 bg-white/10 border border-white/30 rounded-2xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white"
                />
              </div>
            </div>

            <button
              onClick={handleVoucherConnect}
              disabled={voucherLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-semibold py-3 px-4 rounded-2xl transition-all duration-300 flex justify-center items-center"
            >
              {voucherLoading ? (
                <CircleNotch size={20} className="animate-spin" />
              ) : (
                "Connect with Voucher"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Previously Connected Section */}
      <div className="w-full max-w-lg px-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/20">
          <h3 className="text-xl font-semibold mb-4 text-left">
            You previously connected?
          </h3>
          
          <div className="space-y-4">
            <div className="text-left">
              <label className="block text-sm font-medium text-yellow-300 mb-1">Re-Enter voucher code</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="token-id-2"
                  type="text"
                  placeholder="Re-Enter voucher code"
                  className="block w-full pl-12 pr-4 py-3 bg-white/10 border border-white/30 rounded-2xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white"
                />
              </div>
            </div>

            <button
              onClick={() => handleReLogin("token-id-2")}
              disabled={voucherLoading}
              className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-800 text-white font-semibold py-3 px-4 rounded-2xl transition-all duration-300 flex justify-center items-center"
            >
              {voucherLoading ? (
                <CircleNotch size={20} className="animate-spin" />
              ) : (
                "Re-Connect"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Hotline Support */}
      <div className="w-full max-w-lg px-4 mt-auto">
        <div className="bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 flex items-center justify-center space-x-3">
          <Phone size={20} className="text-white" />
          <p className="text-sm">
            Need Help? Call <span className="font-bold">{hotlineNumber}</span>
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-sm text-gray-200 mt-8">
        <p>© {new Date().getFullYear()} TwistNet from chargedMatrix. All rights reserved.</p>
      </footer>
    </section>
  );
};
