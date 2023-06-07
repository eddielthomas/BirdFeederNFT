import { useEffect, useState } from "react";
import { NextPage } from "next";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useForm, FormProvider } from "react-hook-form";
import { ErrorMessage } from "@hookform/error-message";
import { DecentSDK, edition, ipfs } from "@decent.xyz/sdk"; //Note: not using ipfs in demo
import { useAccount, useSigner, useNetwork } from "wagmi";
import { ethers, Wallet, Contract } from "ethers";
import InfoField from "../components/InfoField";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { NFTStorage, Blob } from "nft.storage";
import BirdFeederNFTContractAbi from "../abi/BirdFeederNFT.json";
import { Splide, SplideSlide } from "@splidejs/react-splide";
import "@splidejs/react-splide/css/skyblue";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import "react-tabs/style/react-tabs.css";
import LazyBatchMintForm from "../components/lazyBatchMintForm";
import BatchMintForm from "../components/BatchMintForm";
import ExecuteLazyMintForm from "../components/ExecuteLazyMintForm";
import ExecuteLotteryMint from "../components/ExecuteLotteryMint";
import MintForm from "../components/MintForm";
import LazyMintForm from "../components/LazyMintForm";
import AddFeatureKeyForm from "../components/AddFeatureKeyForm";
import UpdateFeatureKeyFrom from "../components/UpgradFeatrueKeyForm";
import DeleteFeatureKeyFrom from "../components/DeleteFeatureKeyForm";
import GetFeatureKeysForm from "../components/GetFeatureKeysForm";
import Form from "../components/Form";
import GenerateReferralCodeForm from "../components/GenerateReferralCodeForm";
import { sign } from "crypto";

const schema = yup.object().shape({
  collectionName: yup.string().required("Name your collection."),
  symbol: yup.string().required("Give your collection a symbol."),
  tokenPrice: yup
    .number()
    .typeError(
      "Must set price for token. Please set to 0 if you wish for your NFTs to be free."
    ),
  editionSize: yup
    .number()
    .min(1, "Edition size must be greater than 0")
    .typeError("Please enter the number of NFTs included in this collection."),
  maxTokenPurchase: yup.lazy((value) => {
    return value === ""
      ? yup.string()
      : yup
          .number()
          .typeError(
            "Cap must be a valid number. Please set to 0 if you do not wish to set a cap."
          );
  }),
  royalty: yup.lazy((value) => {
    return value === ""
      ? yup.string()
      : yup
          .number()
          .typeError(
            "Royalty must be a valid number. Please set to 0 if you do not wish to set a royalty."
          );
  }),
  nftImage: yup.mixed().test("file", "Upload your NFT art.", (value) => {
    return value?.length > 0;
  }),
});

type FormData = {
  collectionName: string;
  symbol: string;
  description: string;
  nftImage: any;
  editionSize: number;
  tokenPrice: string;
  maxTokenPurchase: number;
  royalty: number;
};

const Admin: NextPage = () => {
  const { data: signer } = useSigner();
  const { chain } = useNetwork();
  const { address, isConnected } = useAccount();
  const [contractAddress, setContractAddress] = useState(
    "0x8724EAcF3FCD43788996C9A3fE580A4fB87462eD"
  );
  const [contractOwner, setContractOwner] = useState("");

  const methods = useForm<FormData>({
    resolver: yupResolver(schema),
  });
  const {
    register,
    getValues,
    handleSubmit,
    clearErrors,
    reset,
    formState: { errors, isValid },
  } = methods;
  const onSubmit = handleSubmit((data) => {
    // add logic to call the relevant function
    console.log(data);
  });

  const [nftImage, setNftImage] = useState({
    preview: "/images/icon.png",
    raw: { type: "" },
  });
  const [showLink, setShowLink] = useState(false);
  const [link, setLink] = useState("");

  const [contractURI, setContractURI] = useState("");
  const [creatorRoyalty, setCreatorRoyalty] = useState(0);
  const [creators, setCreators] = useState<string[]>([]);

  const [discountRate, setDiscountRate] = useState(0);
  const [discounts, setDiscounts] = useState([]);
  const [approved, setApproved] = useState("");
  const [featureKey, setFeatureKey] = useState("");
  const [featureKeys, setFeatureKeys] = useState([]);
  const [mintedTokens, setMintedTokens] = useState([]);
  const [mintedTokensCount, setMintedTokensCount] = useState(0);
  const [myReferralCodes, setMyReferralCodes] = useState([]);
  const [remainingMintable, setRemainingMintable] = useState(0);
  const [isApprovedForAll, setIsApprovedForAll] = useState(false);
  const [lazyMints, setLazyMints] = useState([]);
  const [lockDuration, setLockDuration] = useState(0);
  const [maxMintable, setMaxMintable] = useState(0);
  const [maxRefferalCodesPerUser, setMaxRefferalCodesPerUser] = useState(0);
  const [minimumMintPrice, setMinimumMintPrice] = useState(0);
  const [name, setName] = useState("");
  const [owner, setOwner] = useState("");
  const [ownerOf, setOwnerOf] = useState("");
  const [paused, setPaused] = useState(false);
  const [referralRewardPercentage, setReferralRewardPercentage] = useState(0);
  const [royaltyInfo, setRoyaltyInfo] = useState([]);
  const [supportsInterface, setSupportsInterface] = useState(false);
  const [symbol, setSymbol] = useState("");
  const [tokenSupply, setTokenSupply] = useState(0);
  const [tokenURI, setTokenURI] = useState("");
  const [totalMinted, setTotalMinted] = useState(0);
  const [totalRemainingSupply, setTotalRemainingSupply] = useState(0);
  const [totalSupply, setTotalSupply] = useState(0);
  const [transferFee, setTransferFee] = useState(0);
  const [treasury, setTreasury] = useState("");
  const [unlockTimestamps, setUnlockTimestamps] = useState([]);
  const [uri, setUri] = useState("");
  const [contractBalance, setContractBalance] = useState(0);
  const [maxReferralCodesPerUser, setMaxReferralCodesPerUser] = useState(0);
  const [mintedImages, setMintedImages] = useState<string[]>([]);
  const [mintedNFTMetadata, setMintedNFTMetadata] = useState<string[]>([]);
  const [lazyMintedImages, setLazyMintedImages] = useState<string[]>([]);
  const [lazyMintedNFTMetadata, setLazyMintedNFTMetadata] = useState<string[]>(
    []
  );
  const [tokenFeatureKeys, setTokenFeatureKeys] = useState<string[]>([]);

  const [avaliableLazyMintedTokens, setAvaliableLazyMintedTokens] = useState(
    []
  );
  const [executedLazyMintedTokens, setExecutedLazyMintedTokens] = useState([]);
  const [lazyMintedTokens, setLazyMintedTokens] = useState([]);
  const [lotteryLazyMintedToken, setLotteryLazyMintedToken] = useState([]);
  const [nextLazyMintedToken, setNextLazyMintedToken] = useState(0);
  const [nextLotteryLazyMintIndex, setNextLotteryLazyMintIndex] = useState(0);

  const [isHovering1, setIsHovering1] = useState(false);
  const [isHovering2, setIsHovering2] = useState(false);
  const [isHovering3, setIsHovering3] = useState(false);
  const [contract, setContract] = useState<Contract | null>(null);

  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [external_link, setExternal_link] = useState("");
  const [refresh, setRefresh] = useState(true);

  // why there an error with the above code?
  //error - TypeError: abi.map is not a function
  // const contract = new ethers.Contract(
  //   contractAddress,
  //   BirdFeederNFTContractAbi,
  //   signer
  // );
  // how to fix this?

  useEffect(() => {
    console.log(BirdFeederNFTContractAbi);
  }, []);

  useEffect(() => {
    if (!signer) return;
    let _contract = new ethers.Contract(
      contractAddress,
      BirdFeederNFTContractAbi,
      signer
    );
    setContract(_contract);
  }, [signer]);

  useEffect(() => {
    // fetch contract data here like so:
    // const uri = await contract.contractURI();
    // setContractURI(uri);
    if (!contract) return;
    const fetchData = async () => {
      if (!contract) return;
      getBalance();
      const contractOwner = await contract.owner();
      setContractOwner(contractOwner);

      const contractURI = await contract.contractURI();
      setContractURI(contractURI);

      // the uri is data:application/json;utf8,{"name": "BirdFeeder NFTs", "description": "BirdFeeder NFTs Adopt one today to try out all the OpenSea buying, selling, and bidding feature set.","image": "http://167.71.176.114:8080/ipfs/Qmcc8NEqGVCzzYobfriiHoW1qoMLY4mFxcdZ7Z9LssVozb","external_link": "www.birdfeeder.net"}
      // parse the name and description from the uri

      const uriParts = contractURI.split(",");
      const contractDataString = uriParts[uriParts.length - 1];
      const decodedData = decodeURIComponent(contractDataString);
      const contractData = JSON.parse(decodedData);

      setName(contractData.name);
      setDescription(contractData.description);
      setImage(contractData.image);
      setExternal_link(contractData.external_link);

      const creatorRoyalty = await contract.creatorRoyalty();
      setCreatorRoyalty(creatorRoyalty);

      for (let i = 1; i < 10000; i++) {
        try {
          const creator = await contract.creators(i);
          if (
            !creator ||
            creator === "0x0000000000000000000000000000000000000000"
          )
            break;
          setCreators((prevState) => [...prevState, creator]);
        } catch (error) {
          console.log(error);
        }
      }

      const discountRate = await contract.discountRate();
      setDiscountRate(discountRate);

      const mintedTokens = await contract.getMintedTokens();
      setMintedTokens(mintedTokens);

      const _avaliableLazyMintedTokens =
        await contract.getAvailableLazyMintedTokens();
      setAvaliableLazyMintedTokens(_avaliableLazyMintedTokens);

      const _executedLazyMintedTokens =
        await contract.getExecutedLazyMintedTokens();
      setExecutedLazyMintedTokens(_executedLazyMintedTokens);

      const _lazyMintedTokens = await contract.getLazyMintedTokens();
      // remove the executed lazy minted tokens from the lazy minted tokens
      setLazyMintedTokens(_lazyMintedTokens);

      for (let i = 0; i <= _lazyMintedTokens.length; i++) {
        try {
          const token = _lazyMintedTokens[i];
          // parse the int from big number
          const tkenid = token.toNumber();
          const tokenURI = await contract.getLazyMintTokenURI(tkenid);
          // retreive and parse nft json data from tokenURI  and then get the image attribute
          fetch(tokenURI)
            .then((response) => {
              response.json().then((data) => {
                console.log(data);
                setLazyMintedNFTMetadata((prevState) => [...prevState, data]);
                setLazyMintedImages((prevState) => [...prevState, data.image]);
              });
            })
            .catch((error) => {
              console.log(error);
            });
        } catch (error) {
          console.log(error);
        }
      }

      const _lotteryLazyMintedToken =
        await contract.getLotteryLazyMintedToken();
      setLotteryLazyMintedToken(_lotteryLazyMintedToken);

      // find the index of the lotteryLazyMintedToken in the _avaliableLazyMintedTokens array

      let index = 0;
      for (let i = 0; i <= _lazyMintedTokens.length; i++) {
        if (
          _lazyMintedTokens[i].toNumber() === _lotteryLazyMintedToken.toNumber()
        ) {
          index = i;
          break;
        }
      }
      setNextLotteryLazyMintIndex(index);

      const _nextLazyMintedToken = await contract.getNextLazyMintedToken();
      setNextLazyMintedToken(_nextLazyMintedToken);

      // create for loop to get all minted images and setMintedImages
      for (let i = 0; i <= mintedTokens.length; i++) {
        try {
          const token = mintedTokens[i];
          const tokenURI = await contract.tokenURI(token);
          // retreive and parse nft json data from tokenURI  and then get the image attribute
          fetch(tokenURI)
            .then((response) => {
              response.json().then((data) => {
                console.log(data);
                setMintedNFTMetadata((prevState) => [...prevState, data]);
                setMintedImages((prevState) => [...prevState, data.image]);
              });
            })
            .catch((error) => {
              console.log(error);
            });
        } catch (error) {
          console.log(error);
        }
      }

      const referralRewardPercentage =
        await contract.referralRewardPercentage();

      setReferralRewardPercentage(referralRewardPercentage);

      const _lockDuration = await contract.lockDuration();
      setLockDuration(lockDuration);

      const _maxMintable = await contract.maxMintable();
      setMaxMintable(_maxMintable);

      const _maxRefferalCodesPerUser = await contract.maxReferralCodesPerUser();
      setMaxRefferalCodesPerUser(_maxRefferalCodesPerUser);

      const _minimumMintPrice = await contract.minimumMintPrice();
      setMinimumMintPrice(_minimumMintPrice);

      const _owner = await contract.owner();
      setOwner(_owner);

      const _symbol = await contract.symbol();
      setSymbol(_symbol);

      const _totalRemainingSupply = await contract.totalRemainingSupply();
      setTotalRemainingSupply(_totalRemainingSupply);

      const _totalSupply = await contract.totalSupply();
      setTotalSupply(_totalSupply);

      const _transferFee = await contract.transferFee();
      setTransferFee(_transferFee);

      const _treasury = await contract.treasury();
      setTreasury(_treasury);

      // const featureKey = await contract.featureKey();
      // setFeatureKey(featureKey);

      // const featureKeys = await contract.featureKeys();
      // setFeatureKeys(featureKeys);

      // const mintedTokens = await contract.mintedTokens();
      // setMintedTokens(mintedTokens);

      const _mintedTokensCount = await contract.getMintedTokensCount();
      setMintedTokensCount(_mintedTokensCount);

      const remainingMintable = await contract.getRemainingMintable();
      setRemainingMintable(remainingMintable);

      // // const myReferralCodes = await contract.myReferralCodes();
      // // setMyReferralCodes(myReferralCodes);

      // const isApprovedForAll = await contract.isApprovedForAll(
      //   contractOwner,
      //   contractOwner
      // );
      // setIsApprovedForAll(isApprovedForAll);
    };
    if (refresh == true && contract) {
      fetchData();
      setRefresh(false);
    }
  }, [contract, refresh]);

  useEffect(() => {
    if (signer) {
      let cntr = new ethers.Contract(
        contractAddress,
        BirdFeederNFTContractAbi,
        signer
      );
      setContract(cntr);

      getBalance();
    }
  }, [signer]);

  function StateVariable({ label, value }: { label: string; value: any }) {
    return (
      <div className="card">
        <div className="card-header">{label}</div>
        {/* add rounded corners */}
        <div
          className="card-body form_front"
          style={{ backgroundColor: "ivory", borderRadius: 10 }}
        >
          <p
            className="card-text"
            style={{ color: "darkblue", fontSize: 14, margin: 10 }}
          >
            {value}
          </p>
        </div>
      </div>
    );
  }

  const getBalance = async () => {
    if (!contract || !signer || !signer.provider) return;
    let _balance = await signer.provider.getBalance(contractAddress);
    let balance = _balance.toNumber();

    setContractBalance(balance);
  };

  const resetForm = () => {
    clearErrors();
  };

  const success = (tx: any) => {
    setCreators([]);
    setMintedImages([]);
    setMintedTokens([]);
    setMintedNFTMetadata([]);
    setLazyMintedNFTMetadata([]);
    setLazyMintedImages([]);

    setRefresh(true);
    console.log(tx);
  };
  // add functions to interact with the contract here
  const _setPrice = async (data: any) => {
    try {
      const tx = await contract?.setPrice(data.value);
      await tx?.wait();
      success(tx);
    } catch (error) {
      console.log(error);
    }
  };

  const _mint = async (data: any) => {
    try {
      const tx = await contract?.mint(
        data.recipient,
        data.data,
        data.referrer,
        { value: minimumMintPrice }
      );
      await tx?.wait();
      success(tx);
    } catch (error) {
      console.log(error);
    }
  };

  const _lazyMint = async (data: any) => {
    try {
      // add the amount of bnb to the transaction
      const tx = await contract?.lazyMint(data.data, data.referrer);

      await tx?.wait();
      success(tx);
    } catch (error) {
      console.log(error);
    }
  };
  const _executeLazyMint = async (data: any) => {
    try {
      // add the amount of bnb to the transaction and the lazyMintId
      const tx = await contract?.executeLazyMint(
        parseInt(data.lazyMintId),
        data.to,
        {
          value: minimumMintPrice,
        }
      );

      await tx?.wait();
      success(tx);
    } catch (error) {
      console.log(error);
    }
  };

  const _getFeatureKey = async (data: any) => {
    try {
      const tx = await contract?.F(data.value);
      // await tx?.wait();
      setTokenFeatureKeys(tx);
      success(tx);
    } catch (error) {
      console.log(error);
    }
  };

  const _batchMint = async (data: any) => {
    try {
      const tx = await contract?.batchMint(
        minimumMintPrice,
        data.recipient,
        data.data
      );
      await tx?.wait();
      success(tx);
    } catch (error) {
      console.log(error);
    }
  };

  const _lazyBatchMint = async (data: any) => {
    try {
      let arr = [];
      arr = data.data.split(",");
      const tx = await contract?.lazyBatchMint(arr, []);
      await tx?.wait();
      success(tx);
    } catch (error) {
      console.log(error);
    }
  };

  const _setTokenURI = async (data: any) => {
    try {
      const tx = await contract?.setTokenURI(data.value);
      await tx?.wait();
      success(tx);
    } catch (error) {
      console.log(error);
    }
  };

  const _setBaseURI = async (data: any) => {
    try {
      const tx = await contract?.setBaseURI(data.value);
      await tx?.wait();
      success(tx);
    } catch (error) {
      console.log(error);
    }
  };

  const _setTokenURIPrefix = async (data: any) => {
    try {
      const tx = await contract?.setTokenURIPrefix(data.value);
      await tx?.wait();
      success(tx);
    } catch (error) {
      console.log(error);
    }
  };

  const _addFeatureKey = async (data: any) => {
    try {
      const tx = await contract?.addFeatureKey(
        data.tokenId,
        data.featureName,
        data.userApiKey,
        data.secretKey,
        data.expiresAt
      );
      await tx?.wait();
      success(tx);
    } catch (error) {
      console.log(error);
    }
  };

  const _deleteFeatureKey = async (data: any) => {
    try {
      const tx = await contract?.deleteFeatureKey(data.tokenId, data.index);
      await tx?.wait();
      success(tx);
    } catch (error) {
      console.log(error);
    }
  };

  const _updateFeatureKey = async (data: any) => {
    try {
      const tx = await contract?.updateFeatureKey(
        data.tokenId,
        data.index,
        data.featureName,
        data.userApiKey,
        data.secretKey,
        data.expiresAt,
        data.active
      );
      await tx?.wait();
      success(tx);
    } catch (error) {
      console.log(error);
    }
  };

  const _pause = async (data: any) => {
    try {
      const tx = await contract?.pause();
      await tx?.wait();
      success(tx);
    } catch (error) {
      console.log(error);
    }
  };

  const _unpause = async (data: any) => {
    try {
      const tx = await contract?.unpause();
      await tx?.wait();
      success(tx);
    } catch (error) {
      console.log(error);
    }
  };

  const _setApprovalForAll = async (data: any) => {
    try {
      const tx = await contract?.setApprovalForAll(
        data.operator,
        data.approved
      );
      await tx?.wait();
      success(tx);
    } catch (error) {
      console.log(error);
    }
  };

  const _setContractURIMeta = async (data: any) => {
    try {
      const tx = await contract?.setContractURIMeta(data.value);
      await tx?.wait();
      success(tx);
    } catch (error) {
      console.log(error);
    }
  };
  const _setCreator = async (data: any) => {
    try {
      const tx = await contract?.setCreator(data.newCreator, data.tokenIds);
      await tx?.wait();
      success(tx);
    } catch (error) {
      console.log(error);
    }
  };

  const _generateReferralCode = async (data: any) => {
    try {
      const tx = await contract?.generateReferralCode(data.value);
      await tx?.wait();
      success(tx);
    } catch (error) {
      console.log(error);
    }
  };

  const _getMyReferralCodes = async (data: any) => {
    try {
      const tx = await contract?.getMyReferralCodes(data.value);
      await tx?.wait();
      success(tx);
    } catch (error) {
      console.log(error);
    }
  };
  const _setCreatorRoyalty = async (data: any) => {
    try {
      const tx = await contract?.setCreatorRoyalty(data.value);
      await tx?.wait();
      success(tx);
    } catch (error) {
      console.log(error);
    }
  };

  const _setDiscountRate = async (data: any) => {
    try {
      const tx = await contract?.setDiscountRate(data.value);
      await tx?.wait();
      success(tx);
    } catch (error) {
      console.log(error);
    }
  };

  const _setLockDuration = async (data: any) => {
    try {
      const tx = await contract?.setLockDuration(data.value);
      await tx?.wait();
      success(tx);
    } catch (error) {
      console.log(error);
    }
  };

  const _setMaxMintable = async (data: any) => {
    try {
      const tx = await contract?.setMaxMintable(data.value);
      await tx?.wait();
      success(tx);
    } catch (error) {
      console.log(error);
    }
  };
  const _setMaxReferralCodesPerUser = async (data: any) => {
    try {
      const tx = await contract?.setMaxReferralCodesPerUser(data.value);
      await tx?.wait();
      success(tx);
    } catch (error) {
      console.log(error);
    }
  };

  const _setMintPrice = async (data: any) => {
    try {
      const tx = await contract?.setMintPrice(data.value);
      await tx?.wait();
      success(tx);
    } catch (error) {
      console.log(error);
    }
  };

  const _setProxyRegistryAddress = async (data: any) => {
    try {
      const tx = await contract?.setProxyRegistryAddress(data.value);
      await tx?.wait();
      success(tx);
    } catch (error) {
      console.log(error);
    }
  };

  const _setReferralRewardPercentage = async (data: any) => {
    try {
      const tx = await contract?.setReferralRewardPercentage(data.value);
      await tx?.wait();
      success(tx);
    } catch (error) {
      console.log(error);
    }
  };

  const _setTransferFee = async (data: any) => {
    try {
      const tx = await contract?.setTransferFee(data.value);
      await tx?.wait();
      success(tx);
    } catch (error) {
      console.log(error);
    }
  };

  const _setTreasury = async (data: any) => {
    try {
      const tx = await contract?.setTreasury(data.value);
      await tx?.wait();
      success(tx);
    } catch (error) {
      console.log(error);
    }
  };

  const _withdrawERC20 = async (data: any) => {
    try {
      const tx = await contract?.withdrawERC20(data.tokenAddress);
      await tx?.wait();
      success(tx);
    } catch (error) {
      console.log(error);
    }
  };

  const _withdrawETH = async () => {
    try {
      const tx = await contract?.withdrawETH();
      await tx?.wait();
      success(tx);
    } catch (error) {
      console.log(error);
    }
  };

  // read only functions

  // const contractURI = async (data: any) => { }

  // const creatorRoyalty = async (data: any) => { }

  // const creators = async (data: any) => { }

  // const discountRate = async (data: any) => { }

  // const discounts = async (data: any) => { }

  // const getApproved = async (data: any) => { }

  // const getFeatureKey = async (data: any) => { }

  // const getFeatureKeys = async (data: any) => { }

  // const getMintedTokens = async (data: any) => { }

  // const getMintedTokensCount = async (data: any) => { }

  // const getMyReferralCodes = async (data: any) => { }

  // const getRemainingMintable = async (data: any) => { }

  // const isApprovedForAll = async (data: any) => { }

  // const lazyMints = async (data: any) => { }

  // const lockDuration = async (data: any) => { }

  // const maxMintable = async (data: any) => { }

  // const maxRefferalCodesPerUser = async (data: any) => { }

  // const minimumMintPrice = async (data: any) => { }

  // const mintedTokens = async (data: any) => { }

  // const name = async (data: any) => { }

  // const owner = async (data: any) => { }

  // const ownerOf = async (data: any) => { }

  // const paused  = async (data: any) => { }

  // const referralRewardPercentage = async (data: any) => { }

  // const royaltyInfo = async (data: any) => { }

  // const supportsInterface = async (data: any) => { }

  // const symbol = async (data: any) => { }

  // const tokenSupply = async (data: any) => { }

  // const tokenURI = async (data: any) => { }

  // const totalMinted = async (data: any) => { }

  // const totalRemainingSupply = async (data: any) => { }

  // const totalSupply = async (data: any) => { }

  // const transferFee = async (data: any) => { }

  // const treasury = async (data: any) => { }

  // const unlockTimestamps  = async (data: any) => { }

  // const uri = async (data: any) => { }

  return (
    <div className="background min-h-screen text-white py-24 px-16">
      {
        <div className="flex flex-wrap space-x-10 justify-center">
          <div className="space-y-8 pb-8 text-center">
            <h1>Administration Dashboard</h1>
            <div className="flex justify-center">
              <ConnectButton />
            </div>
          </div>
        </div>
      }
      {contract && mintedImages.length > 0 && (
        <>
          <label className="text-2xl font-bold">Minted Birds</label>
          <Splide
            aria-label="Minted Birds"
            options={{
              type: "slide",
              gap: "1rem",
              perPage: 10,
              start: 0,
              autoplay: true,
            }}
          >
            {/* add map of mintedImages */}
            {mintedImages.map((image, index) => (
              <SplideSlide key={index}>
                <img
                  src={image}
                  style={{ height: "200px", borderRadius: "10px" }}
                  className="form form_front"
                  alt="Bird Image"
                />
              </SplideSlide>
            ))}
          </Splide>
        </>
      )}
      {contract && lazyMintedImages.length > 0 && (
        <>
          <label className="text-white text-2xl">Lazy Minted Birds</label>
          <Splide
            aria-label="Minted Birds"
            options={{
              type: "slide",
              gap: "1rem",
              perPage: 10,
              start: 0,
              autoplay: true,
            }}
          >
            {/* add map of mintedImages */}
            {lazyMintedImages.map((image, index) => (
              <SplideSlide key={index}>
                <img
                  src={image}
                  style={{ height: "200px", borderRadius: "10px" }}
                  className="form form_front"
                  alt="Bird Image"
                />
              </SplideSlide>
            ))}
          </Splide>
        </>
      )}

      <FormProvider {...methods}>
        <>
          <div
            className="col-span-3 form bg-gray-800 p-4 rounded-lg"
            style={{ margin: "10px" }}
          >
            <h1 className="text-xl font-bold mb-4">Contract Details</h1>
            <div className="grid grid-cols-3 gap-4">
              <StateVariable label="Name" value={name} />
              <StateVariable label="Symbol" value={symbol} />
              <StateVariable label="Image" value={image} />
              <StateVariable label="Description" value={description} />
              <StateVariable label="External-URL" value={external_link} />
              <StateVariable
                label="Treasury"
                value={treasury ? treasury.toString() : "Loading..."}
              />

              <StateVariable
                label="Contract Balance"
                value={
                  contractBalance ? contractBalance.toString() : "Loading..."
                }
              />

              <StateVariable
                label="Creator Royalty"
                value={
                  creatorRoyalty
                    ? creatorRoyalty.toString() + "%"
                    : "Loading..."
                }
              />

              <StateVariable
                label="Mint Price"
                value={
                  minimumMintPrice
                    ? minimumMintPrice.toString() + " BNB"
                    : "Loading..."
                }
              />

              <StateVariable
                label="Discount Rate"
                value={
                  discountRate ? discountRate.toString() + "%" : "Loading..."
                }
              />
              <StateVariable
                label="MintedTokens"
                value={mintedTokens ? mintedTokens.toString() : "Loading..."}
              />
              <StateVariable
                label="Available Lazy Mint Tokens"
                value={
                  avaliableLazyMintedTokens
                    ? avaliableLazyMintedTokens.toString()
                    : "Loading..."
                }
              />
              <StateVariable
                label="Executed Lazy Mint Tokens"
                value={
                  executedLazyMintedTokens
                    ? executedLazyMintedTokens.toString()
                    : "Loading..."
                }
              />
              <StateVariable
                label="Total Lazy Mint Tokens"
                value={
                  lazyMintedTokens ? lazyMintedTokens.toString() : "Loading..."
                }
              />
              <StateVariable
                label="Next Lazy Mint Token ID"
                value={
                  nextLazyMintedToken
                    ? nextLazyMintedToken.toString()
                    : "Loading..."
                }
              />
              <StateVariable
                label="Lottery Token ID"
                value={
                  lotteryLazyMintedToken
                    ? lotteryLazyMintedToken.toString()
                    : "Loading..."
                }
              />

              <StateVariable label="Paused" value={paused ? "true" : "false"} />
              <StateVariable
                label="Referral Reward Percentage"
                value={
                  referralRewardPercentage
                    ? referralRewardPercentage.toString() + "%"
                    : "Loading..."
                }
              />
              <StateVariable
                label="Max Token Supply"
                value={maxMintable ? maxMintable.toString() : "Loading..."}
              />
              <StateVariable
                label="Total Minted"
                value={
                  mintedTokensCount
                    ? mintedTokensCount.toString()
                    : "Loading..."
                }
              />
              <StateVariable
                label="Total Remaining Supply"
                value={
                  remainingMintable
                    ? remainingMintable.toString()
                    : "Loading..."
                }
              />
              <StateVariable label="Contract URI" value={contractURI} />
              <StateVariable label="Contract Address" value={contractAddress} />
              <StateVariable
                label="Next Lottery Index"
                value={nextLotteryLazyMintIndex}
              />
              <StateVariable
                label="Creators"
                value={creators.map((creator: any, index: number) => (
                  <div key={index}>
                    <label>{creator}</label>
                  </div>
                ))}
              />
            </div>
          </div>
          {/* <div
            className="grid grid-cols-3 gap-4 form"
            style={{ margin: "10px" }}
          >
            <div className="col-span-2 bg-gray-800 p-4 rounded-lg form_front">
              <h1 className="text-xl font-bold mb-4">Actions</h1>
              <Form
                className="form_details"
                onSubmit={methods.handleSubmit(_setContractURIMeta)}
                placeholder="Contract URI Meta"
                buttonText="Set Contract URI Meta"
              />
              <Form
                onSubmit={methods.handleSubmit(_setCreator)}
                placeholder="New Creator"
                buttonText="Set Creator"
              />
              <Form
                onSubmit={methods.handleSubmit(_setCreatorRoyalty)}
                placeholder="Creator Royalty"
                buttonText="Set Creator Royalty"
              />
              <Form
                onSubmit={methods.handleSubmit(_setDiscountRate)}
                placeholder="Discount Rate"
                buttonText="Set Discount Rate"
              />
            </div>
          </div> */}
          <div
            className="grid grid-cols-3 gap-4 form"
            style={{ margin: "10px" }}
          >
            <div className="col-span-3 bg-gray-800 p-4 rounded-lg form_front">
              <h1 className="text-xl font-bold mb-4">Contract Actions</h1>

              <Tabs>
                <TabList>
                  <Tab>Set Mint Price</Tab>
                  <Tab>Set Contract URI Meta</Tab>
                  <Tab>Set Creator Royalty</Tab>
                  <Tab>Referral Codes</Tab>
                  <Tab>Set Discount Rate</Tab>
                  <Tab>Mint</Tab>
                  <Tab>Lazy Mint</Tab>
                  <Tab>Lazy Batch Mint</Tab>
                  <Tab>Batch Mint</Tab>
                  <Tab>Execute Lazy Mint</Tab>
                  <Tab>Lottery</Tab>
                  <Tab>Get Feature Keys</Tab>
                  <Tab>Add Feature Keys</Tab>
                  <Tab>Update Feature Key</Tab>
                  <Tab>Delete Feature Key</Tab>
                </TabList>
                <TabPanel>
                  <StateVariable
                    label="Mint Price"
                    value={
                      minimumMintPrice
                        ? minimumMintPrice.toString() + " BNB"
                        : "Loading..."
                    }
                  />
                  <Form
                    onSubmit={_setMintPrice}
                    placeholder="Mint Price"
                    buttonText="Set Mint Price"
                  />
                </TabPanel>
                <TabPanel>
                  <StateVariable
                    label="Contract URI Meta"
                    value={contractURI ? contractURI.toString() : "Loading..."}
                  />

                  <Form
                    onSubmit={_setContractURIMeta}
                    placeholder="Contract URI Meta"
                    buttonText="Set Contract URI Meta"
                  />
                </TabPanel>
                <TabPanel>
                  <StateVariable
                    label="Creator Royalty"
                    value={
                      creatorRoyalty
                        ? creatorRoyalty.toString() + "%"
                        : "Loading..."
                    }
                  />
                  <Form
                    onSubmit={_setCreatorRoyalty}
                    placeholder="Creator Royalty"
                    buttonText="Set Creator Royalty"
                  />
                </TabPanel>
                <TabPanel>
                  <GenerateReferralCodeForm
                    onSubmit={_generateReferralCode}
                    connectedAddress={address}
                    getMyReferralCodes={_getMyReferralCodes}
                  />
                </TabPanel>

                <TabPanel>
                  <StateVariable
                    label="Discount Rate"
                    value={
                      discountRate
                        ? discountRate.toString() + "%"
                        : "Loading..."
                    }
                  />
                  <Form
                    onSubmit={_setDiscountRate}
                    placeholder="Discount Rate"
                    buttonText="Set Discount Rate"
                  />
                </TabPanel>

                <TabPanel>
                  <MintForm onSubmit={_mint} />
                </TabPanel>

                <TabPanel>
                  <LazyMintForm onSubmit={_lazyMint} />
                </TabPanel>

                <TabPanel>
                  <LazyBatchMintForm onSubmit={_lazyBatchMint} />
                </TabPanel>
                <TabPanel>
                  <BatchMintForm onSubmit={_batchMint} />
                </TabPanel>
                <TabPanel>
                  <ExecuteLazyMintForm onSubmit={_executeLazyMint} />
                </TabPanel>
                <TabPanel>
                  <ExecuteLotteryMint
                    onSubmit={_executeLazyMint}
                    lazyMintId={nextLotteryLazyMintIndex}
                    image={lazyMintedImages[nextLotteryLazyMintIndex]}
                  />
                </TabPanel>
                <TabPanel>
                  <GetFeatureKeysForm
                    onSubmit={_getFeatureKey}
                    featureKeys={tokenFeatureKeys}
                  />
                </TabPanel>
                <TabPanel>
                  <AddFeatureKeyForm onSubmit={_addFeatureKey} />
                </TabPanel>
                <TabPanel>
                  <UpdateFeatureKeyFrom onSubmit={_updateFeatureKey} />
                </TabPanel>
                <TabPanel>
                  <DeleteFeatureKeyFrom onSubmit={_deleteFeatureKey} />
                </TabPanel>
              </Tabs>
            </div>
          </div>
        </>
      </FormProvider>
    </div>
  );
};

export default Admin;
