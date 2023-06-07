import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

const GenerateReferralCodeForm = ({
  onSubmit,
  connectedAddress,
  getMyReferralCodes,
}) => {
  const { register, handleSubmit } = useForm();
  const [referralCodes, setReferralCodes] = useState([]);
  const [inputValue, setInputValue] = useState("");

  const fetchReferralCodes = async () => {
    if (inputValue === "") return;
    const codes = await getMyReferralCodes(inputValue);
    setReferralCodes(codes);
  };

  const submitHandler = async (data) => {
    data.address = connectedAddress; // The connected wallet address is used
    data.tokenId = inputValue;
    await onSubmit(data);
    fetchReferralCodes(); // fetch referral codes after form is submitted
  };

  return (
    <div>
      <form onSubmit={handleSubmit(submitHandler)} className="form_details">
        <input
          className="input"
          style={{ width: "100%", margin: 10 }}
          {...register("tokenId")}
          placeholder="Token ID"
          onChange={(e) => setInputValue(e.target.value)}
        />
        <button type="submit" className="btn">
          Generate Referral Code
        </button>
      </form>
      <button onClick={fetchReferralCodes} className="btn">
        Refresh My Referral Codes
      </button>
      <h3>My Referral Codes:</h3>
      {referralCodes != undefined && referralCodes.length > 0 ? (
        <ul>
          {referralCodes.map((code, index) => (
            <li key={index}>{code}</li>
          ))}
        </ul>
      ) : (
        <p>No referral codes found.</p>
      )}
    </div>
  );
};

export default GenerateReferralCodeForm;
