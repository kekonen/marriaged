# The flow

1. Prerequisite
   1. install node and npm. For help use `https://github.com/zkpassport/zkpassport-sdk-example`
   2. install foundry
2. Get the repo
3. `npm install`
4. Start setting up the .env file (keep in mind we will get back to .env in later stage):
   1. copy .env.example to .env. 
   2. In .env
      1. Modify PRIVATE_KEY to have your private key for sepolia, make sure that it has some balance
      2. Add your sepolia public to `.env` to `NEXT_PUBLIC_RPC_URL` 
5. Deploy the smart contract
   1. Build first `forge build` (you will see an error verifying the contract deployment, ignore it for now)
   2. Finally, deploy the smart contract using the call `forge script script/Deploy.s.sol --rpc-url {{your seploia rpc url}} --broadcast --verify`, make sure to replace `{{your seploia rpc url}}` with your actual sepolia rpc url
   3. Find the contract address in `Contract Address: 0x...` and add the 0x... part into the `NEXT_PUBLIC_MARRIAGE_REGISTRY_ADDRESS` in `.env`
6. `npm run dev` to start the app
7. locate `http://localhost:3000` to open the app
8.  Congraturlations you have started the app. Now you are ready to start registering marriages on chain and with ZK, and then check it ;)
9.  Follow the flow on the website