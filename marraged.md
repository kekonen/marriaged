# New usecase

We want to make a service to marry 2 people in ZK (without any exposure in created zk marriage certificate - read marriage proof). They both have to be older than 18 and single (single checked on chain). For now we don't want to make a serious app with real legal marriage contracts, but rather 2 people with legit zkpassports could "marry" on chain without any real legal obligations

Currently, the application has only 1 page that makes a proof request of a person's age. I want to modify it to have 2 request (qr codes) that:
1. each request after person scans the qr code, the request comes to the backend (almost just like it does right now), and checks the marrage status in the smart contract.
2. After that, we wait until both people create those proofs (and as in step 1 we check their marriage statuses on chain and age), we first write on evm chain (to realmarriageregistry contract) (using metamask in browser) that both users (with their corresonding unique key, which of course has to be the same for each time a user tries to marry with our app) are not married on chain. As soon as we have written on chain that both of the guys are married, we create a circom proof.
3. Then we need another page, where one could also upload his passport proof and marriage proof which we generated in the previous page to proof that this exact person is married.

Folder "modifications" has
1. raw Marriage registry smart contract - that has to be potentially modified for the usecase, and properly stored in /contracts folder with foundry setup for testing and deploying
2. raw Circom circuits that creates a proof for marriage of 2 people... maybe correct it for our usecase.


The circom proof:
- As public input: the zkPassport public signals (like the passport hash + app binding).
- As private input: any secret data relevant to the app (e.g., some action, attribute).