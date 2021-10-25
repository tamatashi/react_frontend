/* eslint-disable jsx-a11y/no-noninteractive-element-to-interactive-role */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/interactive-supports-focus */
import BSCContext from 'context/BSCContext'
import React, { useContext, useEffect, useState } from 'react'
import Button from 'common/components/Button'
import { useDebouncedCallback } from 'common/hooks/useDebouncedCallback'
import { getBalanceAmount, getDecimalAmount } from 'common/utils/numbers'
import { calculateSlippage, getPancakeFactoryPair, getQuote, getTokenPriceInUSD } from 'common/utils/tokens'
import Slider from 'rc-slider'
import BigNumber from 'bignumber.js'
import Toggle from 'react-toggle'
import { Spinner } from 'react-bootstrap'
import { event } from 'common/utils/ga'
import { toast } from 'react-toastify'
import { toastSettings } from 'common/constants'
import axios from 'axios'
import { supportedTokens } from 'common/data/exchangeData'
import supportedPancakeTokens from 'common/constants/tokens/supportedPancakeTokens.json'
import { getContract, getContractNoABI } from 'common/utils/getContract'
import TokenModal from 'components/TokenModal'
import { ethers } from 'ethers'

const MarketOrder = () => {
    const [showTokenModal, toggleShowTokenModal] = useState(false)

    const tokenA = supportedTokens[0]
    const [tokenB, setTokenB] = useState(supportedPancakeTokens.tokens[0])
    const [tokenAContract, setTokenAContract] = useState()
    const [tokenBContract, setTokenBContract] = useState()
    const [pancakePair, setPancakePair] = useState()

    const [tokenAAmount, setTokenAAmount] = useState('')
    const [tokenBAmount, setTokenBAmount] = useState('')
    const [tokenABalance, setTokenABalance] = useState()
    const [tokenBBalance, setTokenBBalance] = useState()

    const [useRecommendedSlippage, setUseRecommendedSlippage] = useState(true)
    const [slippagePercentage, setSlippagePercentage] = useState('0.5%')
    const [recommendedSlippage, setRecommendedSlippage] = useState(0)

    const [swapInProgress, setSwapInProgress] = useState(false)
    const [needsApproval, setNeedsApproval] = useState(false)
    const [approveInProgress, setApproveInProgress] = useState(false)
    const [loading, setLoading] = useState(false)
    const [loadingQuote, setLoadingQuote] = useState(false)
    const [openLimitOrders, setOpenLimitOrders] = useState([])
    const [allOpenLimitOrders, setAllOpenLimitOrders] = useState([])

    const [currentSwapInUSD, setCurrentSwapInUSD] = useState(0)
    const [currentBNBToTokenPrice, setCurrentBNBToTokenPrice] = useState(null)
    const [loadingBNBTokenPrice, setLoadingBNBTokenPrice] = useState(false)
    const [transactionFeeId, setTransactionFeeId] = useState()

    const bscContext = useContext(BSCContext)

    const loadOpenOrders = async (currentAccountAddress, tokenAddress) => {
        if (currentAccountAddress && tokenAddress) {
            await axios.get(`https://limit-order-manager-dot-utopia-315014.uw.r.appspot.com/retrieveLimitOrders/${currentAccountAddress.toLowerCase()}/${tokenAddress.toLowerCase()}`).then((res) => {
                if (Array.isArray(res.data)) {
                    setOpenLimitOrders(res.data)
                }
            })
        }
    }

    const loadAllOpenOrders = async (tokenAddress) => {
        if (tokenAddress) {
            await axios.get(`https://limit-order-manager-dot-utopia-315014.uw.r.appspot.com/retrievePendingLimitOrders/${tokenAddress.toLowerCase()}`).then((res) => {
                if (Array.isArray(res.data)) {
                    setAllOpenLimitOrders(res.data)
                }
            })
        }
    }

    useEffect(async () => {
        // load open orders on token change
        loadOpenOrders(bscContext.currentAccountAddress, tokenB.address)
        loadAllOpenOrders(tokenB.address)
    }, [bscContext.currentAccountAddress, tokenB.address])

    useEffect(async () => {
        // listens for change in tokens to get new pancake pair contract
        setLoading(true)
        const tokenPair = await getPancakeFactoryPair(tokenA.address, tokenB.address)
        setPancakePair(tokenPair)
        setLoading(false)
    }, [tokenA, tokenB])

    const debouncedOnChangeA = useDebouncedCallback(async (currPancakePair, currTokenAAmount, currTokenA, currTokenB, intervalId) => {
        clearInterval(intervalId)
        if (currTokenAAmount) {
            const quote = await getQuote(currPancakePair, currTokenA, currTokenB, getDecimalAmount(currTokenAAmount, currTokenA.decimals))
            setTokenBAmount(quote)
        } else {
            setTokenBAmount('')
        }
    }, 750)

    const parsedSlippagePercentage = (100 - parseFloat(useRecommendedSlippage ? recommendedSlippage : slippagePercentage)) / 100

    const onSwapClick = async () => {
        event({
            action: 'swap',
            params: {
                fromSymbol: tokenA.symbol,
                toSymbol: tokenB.symbol,
            },
        })
        if (bscContext.currentAccountAddress && bscContext.pancakeSwapRouterV2 && tokenAAmount) {
            let transactionApproved = false
            if (tokenAContract.approve) {
                const approved = await tokenAContract.allowance(bscContext.currentAccountAddress, bscContext.utopiaLimitOrderAddress)
                if (approved.toString() === '0') {
                    setNeedsApproval(true)
                    toast.info('Please Approve this transaction', toastSettings)
                } else {
                    transactionApproved = true
                }
            }

            if (transactionApproved) {
                setSwapInProgress(true)
                const amountUTOPIAHeld = bscContext.tokenBalances.find((token) => token.TokenAddress.toLowerCase() === '0x1a1d7c7A92e8d7f0de10Ae532ECD9f63B7EAf67c'.toLowerCase())
                const enoughUTOPIAHeld = getBalanceAmount(amountUTOPIAHeld.TokenQuantity, 9).isGreaterThanOrEqualTo(new BigNumber(50000000))
                const transactionFee = await getQuote(
                    await getPancakeFactoryPair('0x55d398326f99059fF775485246999027B3197955', '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c'),
                    {
                        address: '0x55d398326f99059fF775485246999027B3197955',
                        symbol: 'USDT',
                        decimals: 18,
                    },
                    {
                        name: 'WBNB Token',
                        symbol: 'WBNB',
                        address: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c',
                        decimals: 18,
                    },
                    getDecimalAmount(enoughUTOPIAHeld ? 0.5 : 1, 18)
                )
                const tx = {
                    from: bscContext.currentAccountAddress,
                    to: '0x553fFB649ABD0c52813879451Ccb64f8E9e02630',
                    value: getDecimalAmount(transactionFee, 18).toFixed(0),
                }
                if (!transactionFeeId) {
                    toast.info('Please Approve Limit Order Fee')

                    await window.web3.eth
                        .sendTransaction(tx)
                        .then(async (res) => {
                            setTransactionFeeId(res.transactionHash)
                            toast.success('Transaction Fee Accepted')
                            toast.info('Please Approve Swap to WBNB')
                            await bscContext.WBNBContract.deposit({ value: ethers.utils.parseEther(tokenAAmount.toString()) })

                            await axios
                                .post(
                                    'https://limit-order-manager-dot-utopia-315014.uw.r.appspot.com/createLimitOrder',
                                    {
                                        ordererAddress: bscContext.currentAccountAddress.toLowerCase(),
                                        tokenInAddress: tokenA.address.toLowerCase(),
                                        tokenOutAddress: tokenB.address.toLowerCase(),
                                        tokenInAmount: getDecimalAmount(tokenAAmount, tokenA.decimals).toFixed(),
                                        tokenOutAmount: getDecimalAmount(tokenBAmount, tokenB.decimals).toFixed(),
                                        tokenPrice: getDecimalAmount(tokenBAmount, 18).dividedBy(getDecimalAmount(tokenAAmount, tokenA.decimals)),
                                        slippage: parseFloat(useRecommendedSlippage ? recommendedSlippage : slippagePercentage) * 100,
                                        feeTxHash: res.transactionHash,
                                    },
                                    {
                                        timeout: 5000,
                                    }
                                )
                                .then((result) => {
                                    if (result.data.status !== 'Success') {
                                        throw new Error('Limit Order Failed')
                                    }
                                    setSwapInProgress(false)
                                    toast.success('Limit Order Placed!', toastSettings)
                                    loadOpenOrders(bscContext.currentAccountAddress, tokenB.address)
                                })
                                .catch((error) => {
                                    toast.error(error.message, toastSettings)
                                    setSwapInProgress(false)
                                })
                            setTransactionFeeId(undefined)
                        })
                        .catch(() => {
                            toast.error('Transaction Canceled')
                        })
                } else {
                    try {
                        await bscContext.WBNBContract.deposit({ value: ethers.utils.parseEther(tokenAAmount.toString()) })

                        await axios
                            .post(
                                'https://limit-order-manager-dot-utopia-315014.uw.r.appspot.com/createLimitOrder',
                                {
                                    ordererAddress: bscContext.currentAccountAddress.toLowerCase(),
                                    tokenInAddress: tokenA.address.toLowerCase(),
                                    tokenOutAddress: tokenB.address.toLowerCase(),
                                    tokenInAmount: getDecimalAmount(tokenAAmount, tokenA.decimals).toFixed(),
                                    tokenOutAmount: getDecimalAmount(tokenBAmount, tokenB.decimals).toFixed(),
                                    tokenPrice: getDecimalAmount(tokenBAmount, 18).dividedBy(getDecimalAmount(tokenAAmount, tokenA.decimals)),
                                    slippage: parseFloat(useRecommendedSlippage ? recommendedSlippage : slippagePercentage) * 100,
                                    feeTxHash: transactionFeeId,
                                },
                                {
                                    timeout: 5000,
                                }
                            )
                            .then((result) => {
                                if (result.data.status !== 'Success') {
                                    throw new Error('Limit Order Failed')
                                }
                                setSwapInProgress(false)
                                toast.success('Limit Order Placed!', toastSettings)
                                loadOpenOrders(bscContext.currentAccountAddress, tokenB.address)
                            })
                            .catch((error) => {
                                toast.error(error.message, toastSettings)
                                setSwapInProgress(false)
                            })
                    } catch {
                        toast.error('Order Placement Failed, Please Try again')
                    }

                    setTransactionFeeId(undefined)
                }
            }
        }
    }

    const onCancelOrderClick = async (orderCode) => {
        await axios.delete(`https://limit-order-manager-dot-utopia-315014.uw.r.appspot.com/deleteLimitOrder/${tokenB.address.toLowerCase()}/${orderCode}`).then(() => {
            loadOpenOrders(bscContext.currentAccountAddress, tokenB.address)
        })
    }

    const confirmCancelation = async (orderCode) => {
        toast.warn(
            <div>
                Confirm Cancelation?{' '}
                <div role="button" onClick={() => onCancelOrderClick(orderCode)}>
                    Yes
                </div>
            </div>
        )
    }

    const copyToClipboard = (address) => {
        navigator.clipboard.writeText(address)
        toast.info('Copied Address to Clipboard', toastSettings)
    }

    useEffect(async () => {
        if (bscContext.currentAccountAddress) {
            const currentlySelectedTokenBalance = bscContext.tokenBalances.find((token) => token.TokenAddress.toLowerCase() === tokenB.address.toLowerCase())
            const tokenQuantity =
                currentlySelectedTokenBalance?.TokenDivisor === '9' ? getBalanceAmount(currentlySelectedTokenBalance?.TokenQuantity, 9) : getBalanceAmount(currentlySelectedTokenBalance?.TokenQuantity)
            setTokenABalance(getBalanceAmount(bscContext.currentBnbBalance))
            setTokenBBalance(tokenQuantity)
        } else {
            setTokenABalance('-')
            setTokenBBalance('-')
        }
    }, [bscContext.currentAccountAddress, tokenA.address, tokenB.address, bscContext.tokenBalances])

    useEffect(async () => {
        try {
            const tokenAabi = await import(`../../../ABI/tokenABI/${tokenA.symbol.toUpperCase()}.js`)
            const currentTokenAContract = getContract(tokenAabi.default, tokenA.address, bscContext.signer)
            currentTokenAContract.defaultAccount = bscContext.currentAccountAddress
            setTokenAContract(currentTokenAContract)
        } catch (e) {
            const currentTokenAContract = await getContractNoABI(tokenA.address, bscContext.signer)
            currentTokenAContract.defaultAccount = bscContext.currentAccountAddress
            setTokenAContract(currentTokenAContract)
        }
        try {
            const tokenBabi = await import(`../../../ABI/tokenABI/${tokenB.symbol.toUpperCase()}.js`)
            const currentTokenBContract = getContract(tokenBabi.default, tokenB.address, bscContext.signer)
            currentTokenBContract.defaultAccount = bscContext.currentAccountAddress
            setTokenBContract(currentTokenBContract)
        } catch (e) {
            const currentTokenBContract = await getContractNoABI(tokenB.address, bscContext.signer)
            currentTokenBContract.defaultAccount = bscContext.currentAccountAddress
            setTokenBContract(currentTokenBContract)
        }
    }, [tokenA, tokenB, bscContext.signer])

    useEffect(async () => {
        const tokenASlippage = await calculateSlippage(tokenAContract)
        const tokenBSlippage = await calculateSlippage(tokenBContract)
        if (tokenASlippage || tokenBSlippage) {
            setRecommendedSlippage(tokenASlippage + tokenBSlippage + 2)
        } else {
            setRecommendedSlippage(0.5)
        }
    }, [tokenAContract, tokenBContract]) // set the recommended slippate value

    useEffect(async () => {
        try {
            const currentTokenInUSD = await getTokenPriceInUSD(tokenA.address, tokenA.decimals)
            setCurrentSwapInUSD(currentTokenInUSD)
        } catch (e) {
            setCurrentSwapInUSD(0)
        }
    }, [tokenA])

    useEffect(async () => {
        setLoadingQuote(true)
        if (tokenAAmount) {
            const newQuote = await getQuote(pancakePair, tokenA, tokenB, getDecimalAmount(tokenAAmount, tokenA.decimals))
            setTokenBAmount(newQuote)
        }
        setLoadingQuote(false)
    }, [pancakePair])

    useEffect(async () => {
        setLoadingBNBTokenPrice(true)
        const currentBNBToTokenQuote = await getQuote(pancakePair, tokenA, tokenB, getDecimalAmount(1, tokenA.decimals))
        setCurrentBNBToTokenPrice(currentBNBToTokenQuote)
        setLoadingBNBTokenPrice(false)
    }, [pancakePair])

    const amountInUSD = currentSwapInUSD > 0 ? new BigNumber(currentSwapInUSD).multipliedBy(new BigNumber(tokenAAmount)).toFormat(3) : '?'

    return (
        <>
            <div className="d-flex justify-content-between">
                <div className="market-trade-buy limit-order">
                    <form action="#">
                        <div className="input-group top from">
                            <input
                                type="number"
                                className="form-control"
                                required
                                onWheel={() => {
                                    document.activeElement.blur()
                                }}
                                value={tokenAAmount}
                                onInput={(e) => {
                                    setTokenAAmount(e.target.value)
                                    debouncedOnChangeA(pancakePair, e.target.value, tokenA, tokenB)
                                }}
                            />
                            <div className="token-A-balance">
                                <Button
                                    title="MAX"
                                    onClick={() => {
                                        setTokenAAmount(tokenABalance)
                                    }}
                                />
                                <div
                                    role="button"
                                    className="balance"
                                    onClick={() => {
                                        setTokenAAmount(tokenABalance)
                                    }}
                                >
                                    Balance: {BigNumber.isBigNumber(tokenABalance) ? tokenABalance.toFixed(6) : '-'}
                                </div>
                            </div>
                            <div className="sub-price">In USD: {tokenAAmount ? `$${amountInUSD}` : '-'}</div>
                            <div className="input-group-append">
                                <Button title={tokenA.displaySymbol || tokenA.symbol} disabled />
                            </div>
                        </div>
                        <div className="input-group to">
                            <input
                                type="number"
                                className="form-control"
                                required
                                value={tokenBAmount}
                                onWheel={() => {
                                    document.activeElement.blur()
                                }}
                                onInput={(e) => {
                                    setTokenBAmount(e.target.value)
                                }}
                            />
                            <div className="token-B-balance">
                                <div className="balance">Balance: {BigNumber.isBigNumber(tokenBBalance) ? tokenBBalance.toFixed(6) : '-'}</div>
                            </div>
                            <div className="sub-price">
                                Min Receieved: {(tokenBAmount * parsedSlippagePercentage).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 8 })}
                            </div>
                            <div className="input-group-append">
                                <Button className="token-swap-to" title={tokenB.displaySymbol || tokenB.symbol} onClick={() => toggleShowTokenModal(!showTokenModal)} />
                            </div>
                        </div>
                        <p>Limit Orders cost $1 worth of BNB or $0.50 if you are holding at least 50,000,000 UTOPIA</p>

                        <div className="slippage-container">
                            <div className="slippage-settings">
                                <span>
                                    SLIPPAGE&nbsp;
                                    <span className="recommended-slippage-toggle">
                                        <Toggle
                                            defaultChecked={useRecommendedSlippage}
                                            icons={false}
                                            onChange={(e) => {
                                                setUseRecommendedSlippage(e.target.checked)
                                            }}
                                        />{' '}
                                        AUTO-SLIPPAGE
                                    </span>
                                </span>
                                <input
                                    className="slippage-percentage-input"
                                    type="text"
                                    value={slippagePercentage}
                                    onChange={(e) => setSlippagePercentage(e.target.value)}
                                    onBlur={(e) => e.target.value && setSlippagePercentage(`${parseFloat(e.target.value)}%`)}
                                />
                            </div>
                            <Slider
                                min={0}
                                max={50}
                                marks={{ 10: '10', 20: '20', 30: '30', 40: '40', 50: '50' }}
                                value={parseFloat(slippagePercentage)}
                                onChange={(e) => {
                                    setSlippagePercentage(`${e}%`)
                                }}
                            />
                        </div>

                        {bscContext.currentAccountAddress ? (
                            <>
                                {swapInProgress || approveInProgress ? (
                                    <div className="spinner-container">
                                        <Spinner size="" animation="border" variant="primary" />
                                    </div>
                                ) : (
                                    <>
                                        {needsApproval && (
                                            <button
                                                type="button"
                                                className="btn buy"
                                                onClick={async () => {
                                                    setApproveInProgress(true)
                                                    try {
                                                        const tx = await tokenAContract.approve(
                                                            bscContext.utopiaLimitOrderAddress,
                                                            '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
                                                        )
                                                        await tx.wait()
                                                        setNeedsApproval(false)
                                                        setApproveInProgress(false)
                                                        toast.success('Swap Approved', toastSettings)
                                                    } catch (e) {
                                                        toast.error('Error Approving', toastSettings)
                                                        setApproveInProgress(false)
                                                    }
                                                }}
                                            >
                                                Approve
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            className="btn buy"
                                            onClick={onSwapClick}
                                            disabled={loading || loadingQuote || !tokenAAmount || new BigNumber(tokenAAmount).isGreaterThan(new BigNumber(tokenABalance))}
                                        >
                                            Place Order
                                        </button>
                                    </>
                                )}
                            </>
                        ) : (
                            <button
                                type="button"
                                className="btn buy"
                                onClick={async () => {
                                    await bscContext.triggerDappModal()
                                }}
                            >
                                Connect Wallet
                            </button>
                        )}
                    </form>
                    <div className="order-book-container">
                        <h4>Your Orders</h4>
                        <div className="order-book-list">
                            {loadingBNBTokenPrice ? (
                                <div className="spinner-container">
                                    <Spinner size="" animation="border" variant="primary" />
                                </div>
                            ) : (
                                <>
                                    {openLimitOrders.length ? (
                                        openLimitOrders.map((openOrder, index) => {
                                            const percentChange = currentBNBToTokenPrice
                                                ? new BigNumber(openOrder.tokenPrice)
                                                      .minus(new BigNumber(currentBNBToTokenPrice))
                                                      .dividedBy(new BigNumber(openOrder.tokenPrice))
                                                      .multipliedBy(new BigNumber(100))
                                                      .toFixed(3)
                                                : '-'

                                            return (
                                                <div className="open-limit-order">
                                                    <p>{`Order Code: ${openOrder.orderCode.substr(0, 8)}...`}</p>
                                                    <div className="open-limit-order-row">
                                                        <span>{`Amount In: ${getBalanceAmount(openOrder.tokenInAmount, tokenA.decimals)} ${tokenA.displaySymbol}`}</span>
                                                        <span>{`Order Status: ${openOrder.orderStatus}`}</span>
                                                    </div>
                                                    <div className="open-limit-order-row">
                                                        <span>{`Target Out: ${getBalanceAmount(openOrder.tokenOutAmount, tokenB.decimals)} ${tokenB.symbol}`}</span>
                                                        <span>{`Percent Change: ${percentChange}%`}</span>
                                                    </div>
                                                    {openOrder.orderStatus === 'PENDING' && (
                                                        <div className="open-limit-order-row">
                                                            <span>{`Tries: ${openOrder.attempts}/5`}</span>
                                                            <div className="cancel-order" role="button" onClick={() => confirmCancelation(openOrder.orderCode)}>
                                                                Cancel Order
                                                            </div>
                                                        </div>
                                                    )}
                                                    {index !== openLimitOrders.length - 1 && <hr />}
                                                </div>
                                            )
                                        })
                                    ) : (
                                        <div>{`No open orders found for ${tokenB.symbol}`}</div>
                                    )}
                                </>
                            )}
                        </div>
                        <p>If your limit order fails (due to insufficient funds or otherwise) it will be retried 5 times before it is cancelled.</p>
                    </div>
                    <div className="order-book-container">
                        <h4>Open Orders</h4>
                        <div className="order-book-list">
                            {loadingBNBTokenPrice ? (
                                <div className="spinner-container">
                                    <Spinner size="" animation="border" variant="primary" />
                                </div>
                            ) : (
                                <>
                                    {allOpenLimitOrders.length ? (
                                        allOpenLimitOrders.map((openOrder, index) => {
                                            const percentChange = currentBNBToTokenPrice
                                                ? new BigNumber(openOrder.tokenPrice)
                                                      .minus(new BigNumber(currentBNBToTokenPrice))
                                                      .dividedBy(new BigNumber(openOrder.tokenPrice))
                                                      .multipliedBy(new BigNumber(100))
                                                      .toFixed(3)
                                                : '-'

                                            return (
                                                <div className="open-limit-order">
                                                    <p>{`Order Code: ${openOrder.orderCode.substr(0, 4)}...${openOrder.orderCode.substr(49, 5)}`}</p>
                                                    <p role="button" onClick={() => copyToClipboard(openOrder.ordererAddress)}>{`Owner: ${openOrder.ordererAddress}`}</p>
                                                    <div className="open-limit-order-row">
                                                        <span>{`Amount In: ${getBalanceAmount(openOrder.tokenInAmount, tokenA.decimals)} ${tokenA.displaySymbol}`}</span>
                                                        <span>{`Order Status: ${openOrder.orderStatus}`}</span>
                                                    </div>
                                                    <div className="open-limit-order-row">
                                                        <span>{`Target Out: ${getBalanceAmount(openOrder.tokenOutAmount, tokenB.decimals)} ${tokenB.symbol}`}</span>
                                                        <span>{`Percent Change: ${percentChange}%`}</span>
                                                    </div>
                                                    {index !== openLimitOrders.length - 1 && <hr />}
                                                </div>
                                            )
                                        })
                                    ) : (
                                        <div>{`No open orders found for ${tokenB.symbol}`}</div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <TokenModal
                toggleShowTokenModal={toggleShowTokenModal}
                show={showTokenModal}
                onTokenSelect={async (token) => {
                    setTokenB(token)
                    toggleShowTokenModal(false)
                }}
            />
        </>
    )
}

export default MarketOrder