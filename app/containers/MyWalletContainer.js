import React from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Clipboard } from 'react-native'
import { connect } from 'react-redux';
import {RESPONSE_SUCCESS, funGetDateStr, isRTLCheck, getProportionalFontSize } from '../utils/EDConstants';
import BaseContainer from './BaseContainer';
import { strings, isRTL } from '../locales/i18n';
import {  NavigationEvents } from 'react-navigation';
import { showDialogue } from '../utils/EDAlert';
import { netStatus } from '../utils/NetworkStatusConnection';
import { getWalletHistoryAPI } from '../utils/ServiceManager';
import { EDColors } from '../utils/EDColors';
import ProgressLoader from '../components/ProgressLoader';
import { EDFonts } from '../utils/EDFontConstants';
import { Icon } from 'react-native-elements';
import EDPlaceholderComponent from '../components/EDPlaceholderComponent';
import { Spinner } from 'native-base';
import { saveWalletMoneyInRedux } from '../redux/actions/User';
import Assets from '../assets';
import metrics from '../utils/metrics';
import { widthPercentageToDP } from 'react-native-responsive-screen';
import EDPopupView from '../components/EDPopupView';
import EDRTLText from '../components/EDRTLText';
import Share from "react-native-share";
import { DURATION } from "react-native-easy-toast";
import { saveNavigationSelection } from '../redux/actions/Navigation';
import EDRTLView from '../components/EDRTLView';
import EDEarnMoreComponent from '../components/EDEarnMoreComponent';

class MyWalletContainer extends React.Component {

    shouldLoadMore = false
    refreshing = false
    current_balance = undefined
    total_credited = undefined

    //State
    state = {
        isLoading: false,
        moreLoading: false,
        arrayTransactions: undefined,
        earningModal: false
    }

    /**
     * On did focus wallet container
     */
    onDidFocusWalletContainer = () => {
        this.props.saveNavigationSelection("Wallet");
        if (this.props.userID !== "" && this.props.userID !== undefined && this.props.userID !== null) {
            this.setState({ arrayTransactions: undefined })
            this.getWalletHistory()
        } else {
            showDialogue(strings("loginValidation"), [], strings("appName"), () => {
                this.props.navigation.navigate("LoginContainer")
                // this.props.navigation.dispatch(
                //     StackActions.reset({
                //         index: 0,
                //         actions: [
                //             NavigationActions.navigate({ routeName: "LoginContainer" })
                //         ]
                //     })
                // );
            });
        }
    }

    /**
     * Get Wallet Historey
     */
    getWalletHistory = (isForRefresh) => {
        this.strOnScreenMessage = ''
        this.strOnScreenSubtitle = ''
        netStatus(isConnected => {
            if (isConnected) {
                this.setState({ isLoading: true });

                let param = {
                    language_slug: this.props.lan,
                    user_id: parseInt(this.props.userID) || 0,
                    // token: this.props.userToken,
                    count: 10,
                    page_no: (this.state.arrayTransactions && !isForRefresh) ? parseInt(this.state.arrayTransactions.length / 10) + 1 : 1
                }
                getWalletHistoryAPI(param, this.onSuccessFetchWallet, this.onFailureFetchWallet, this.props, true);
            } else {
                this.strOnScreenMessage = strings('noInternetTitle');
                this.strOnScreenSubtitle = strings('noInternet');
                this.setState({ isLoading: false, moreLoading: false })

            }
        })
    }

    /**
     * On success fetch wallet
     */
    onSuccessFetchWallet = (onSuccess) => {
        if (this.state.arrayTransactions == undefined)
            this.state.arrayTransactions = []
        if (onSuccess != undefined && onSuccess.status == RESPONSE_SUCCESS) {
            let totalTransactions = onSuccess.total_transactions || 0
            let arr = onSuccess.wallet_history
            this.shouldLoadMore = this.state.arrayTransactions.length + arr.length < totalTransactions
            this.current_balance = onSuccess.wallet_money
            this.props.saveWalletMoney(onSuccess.wallet_money)
            this.total_credited = onSuccess.total_money_credited
            this.currency_symbol = onSuccess.currency
            this.setState({ arrayTransactions: [...this.state.arrayTransactions, ...arr], isLoading: false, moreLoading: false })
        }
        else {
            this.strOnScreenMessage = strings('generalWebServiceError')
            this.setState({ isLoading: false, moreLoading: false })
        }
    }

    /**
    * On failure fetch wallet
    */

    onFailureFetchWallet = (onFailure) => {
        this.strOnScreenMessage = strings('generalWebServiceError')
        this.setState({ isLoading: false, moreLoading: false })
    }

    onBackPressedEvent = () => {
        this.props.navigation.openDrawer();
    }

    renderTransaction = (data) => {
        return (
            <EDRTLView style={style.transactionContainer}>
                <EDRTLView style={{ flex: .75 }}>
                    <View style={style.walletIconView}>
                        <EDRTLView style={style.cashIconView}>
                            <Text style={[style.currentIconStyle]} numberOfLines={1}>
                                {"$"}
                            </Text>
                            <Icon style={style.cashIconStyle} name={data.item.debit == "1" ? "arrow-upward" : "arrow-downward"} color={data.item.debit == "1" ? EDColors.error : "green"} size={getProportionalFontSize(15)} />
                        </EDRTLView>
                    </View>
                    <View>
                        <EDRTLText style={[style.reasonStyle]} numberOfLines={2}
                            title={data.item.reason}
                        />
                        <EDRTLText style={[style.reasonDate]} numberOfLines={1}
                            title={funGetDateStr(data.item.created_date, "MM-DD-YYYY, hh:mm A")} />
                    </View>
                </EDRTLView>
                <View style={{ flex: .25, alignItems: isRTLCheck() ? "flex-start" : "flex-end" }}>
                    <EDRTLText style={[style.cashText, { textAlign: isRTLCheck() ? "left" : "right", color: data.item.debit == "1" ? EDColors.error : "#41D634", flex: 1 }]}
                        title={data.item.debit == "1" ?
                            isRTLCheck() ? this.currency_symbol + data.item.amount + " -" : "- " + this.currency_symbol + data.item.amount

                            : isRTLCheck() ? this.currency_symbol + data.item.amount + " +" : "+ " + this.currency_symbol + data.item.amount}
                    />
                </View>
            </EDRTLView>
        )
    }

    /**
     * Load More On end reached
     */

    loadMoreTransaction = () => {
        if (this.shouldLoadMore && !this.state.moreLoading && !this.state.isLoading) {
            this.setState({ moreLoading: true })
            this.getWalletHistory()
        }
    }

    /**
     * Pull to refresh
     */

    pullToRefresh = () => {
        this.refreshing = false
        this.shouldLoadMore = false
        this.state.arrayTransactions = undefined
        this.strOnScreenMessage = ''
        this.strOnScreenSubtitle = ''
        this.getWalletHistory(true)
    }

    //#region  Network

    networkConnectivityStatus = () => {
        if (this.total_credited == undefined || this.state.arrayTransactions == undefined) {
            this.state.arrayTransactions = undefined
            this.setState({ isLoading: true });
            this.getWalletHistory()
        }
    }

    showEarnPopup = () => {
        this.setState({ earningModal: true })
    }

    closeEarningModal = () => {
        this.setState({ earningModal: false })
    }


    /**
     * Copy to clipboard
     */

    copyToClipboard = () => {
        this.refs.toast.show(strings("codeCopied"), DURATION.LENGTH_SHORT);
        Clipboard.setString(this.props.referral_code)
    }

    /**
     * Share app
     */
    shareApp = () => {
        const shareOptions = {
            title: strings("shareApp"),
            message: strings("shareAppMessage") + '\niOS: ' + this.props.storeURL.app_store_url +
                '\nAndroid: ' + this.props.storeURL.play_store_url + '\n' + strings('usePromo') + (this.props.referral_code || '') +
                strings('rewardMsg'),
        };
        console.log("SHARE OPTION{}{}", shareOptions)
        Share.open(shareOptions);
    }

    renderEarningModal = () => {
        return (
            <EDPopupView isModalVisible={this.state.earningModal} shouldDismissModalOnBackButton={true} onRequestClose={this.closeEarningModal}>


                <EDEarnMoreComponent
                    closeEarningModal={this.closeEarningModal}
                    // copyToClipboard={this.copyToClipboard}
                    referral_code={this.props.referral_code}
                    shareApp={this.shareApp}
                    isClose={true}
                />

            </EDPopupView>
        )
    }
    renderFooter = () => {
        return (
            <>
                {this.state.moreLoading ? <Spinner size="large" color={EDColors.primary} style={{ height: 40 }} /> : null}
            </>
        )
    }


    render() {
        return (
            <BaseContainer
                title={strings("myWallet")}
                left={'menu'}
                right={[]}
                onLeft={this.onBackPressedEvent}
                onConnectionChangeHandler={this.networkConnectivityStatus}
            >
                <NavigationEvents onDidFocus={this.onDidFocusWalletContainer} />

                {this.state.isLoading && !this.state.moreLoading ? <ProgressLoader /> :
                    <View style={style.mainContainer}>
                        {this.renderEarningModal()}

                        {this.current_balance !== undefined ?
                            <>
                                {/* VIKRANT 30-07-21 */}
                                <EDRTLView style={style.header}>
                                    <View style={style.walletView}>
                                        <EDRTLView style={{ alignItems: "center" }}>
                                            <Text style={style.walletHeader}>
                                                {strings("yourWalletBalance")}
                                            </Text>

                                        </EDRTLView>
                                        <Text style={[style.walletText, { fontFamily: EDFonts.bold, textAlign: isRTLCheck() ? 'right' : 'left' }]}>
                                            {this.currency_symbol + this.current_balance}
                                        </Text>
                                        <TouchableOpacity onPress={this.showEarnPopup} activeOpacity={1}>
                                            <EDRTLView style={style.shareBtn}>
                                                {/* <Icon name="redeem" color={EDColors.white} size={15} /> */}
                                                <Text style={[style.btnText]} >{strings("earnMore")} </Text>
                                            </EDRTLView>
                                        </TouchableOpacity>
                                    </View>
                                    {/* <Image source={this.props.image !== undefined && this.props.image !== null && this.props.image.trim() !== "" ? { uri: this.props.image } : Assets.user_placeholder} style={style.headerImage} /> */}
                                    <Icon name="wallet-outline" type={'ionicon'} reverse size={getProportionalFontSize(30)} color={'#EFEFEF'} reverseColor={EDColors.black} />
                                </EDRTLView>

                                <View style={style.earning}>
                                    <EDRTLView style={style.earningView}>
                                        <Text style={[style.headerText]}>
                                            {strings("transactions")}
                                        </Text>
                                        {this.total_credited !== undefined && this.total_credited !== 0 && this.total_credited !== "0.00" ?
                                            <Text style={[style.normalHeader]}>
                                                {isRTLCheck() ?
                                                    strings("totalEarned") + parseFloat(this.total_credited).toFixed(2) + this.currency_symbol :
                                                    strings("totalEarned") + this.currency_symbol + parseFloat(this.total_credited).toFixed(2)}
                                            </Text> : null}
                                    </EDRTLView>
                                    {this.state.arrayTransactions !== undefined && this.state.arrayTransactions !== null && this.state.arrayTransactions.length !== 0 ?
                                        <FlatList
                                            ListFooterComponent={this.renderFooter()}
                                            showsVerticalScrollIndicator={false}
                                            data={this.state.arrayTransactions}
                                            keyExtractor={(item, index) => item + index}
                                            renderItem={this.renderTransaction}
                                            onEndReached={this.loadMoreTransaction}
                                            onEndReachedThreshold={0.5}
                                            refreshControl={<RefreshControl
                                                refreshing={this.refreshing}
                                                title={strings('refreshing')}
                                                titleColor={EDColors.textAccount}
                                                tintColor={EDColors.textAccount}
                                                colors={[EDColors.primary]}
                                                onRefresh={this.pullToRefresh} />}

                                        />
                                        :
                                        <EDPlaceholderComponent
                                            placeholderIcon={Assets.logo}
                                            title={this.strOnScreenMessage !== undefined && this.strOnScreenMessage.trim().length !== 0 ? this.strOnScreenMessage : strings("noTransactions")} />}
                                </View>
                            </> :
                            (this.strOnScreenMessage !== undefined && this.strOnScreenMessage.trim().length !== 0) ?
                                <EDPlaceholderComponent
                                    placeholderIcon={Assets.logo}
                                    title={this.strOnScreenMessage} onBrowseButtonHandler={this.getWalletHistory} buttonTitle={strings("reloadScreen")} /> : null
                        }
                    </View>
                }
            </BaseContainer>
        )
    }
}

/**
 * StyleSheet
 */

const style = StyleSheet.create({
    mainContainer: {
        flex: 1,
        padding: 10,
    },
    earningModal: {
        backgroundColor: EDColors.white,
        borderRadius: 6,
        width: metrics.screenWidth * .9,
        alignSelf: "center",
        padding: 10
    },
    share: {
        backgroundColor: "green",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 10,
        marginTop: 15,
        paddingVertical: 5,
        borderRadius: 25,
        elevation: 1,
        width: widthPercentageToDP("35%"),
    },
    shareBtn: {
        backgroundColor: EDColors.primary,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 10,
        marginTop: 15,
        paddingVertical: 5,
        borderRadius: 16,
        elevation: 1,
        width: metrics.screenWidth * 0.4,
        height: metrics.screenHeight * 0.065
    },
    headerImage: {
        borderWidth: 2,
        borderColor: EDColors.primary,
        width: metrics.screenWidth * 0.15,
        height: metrics.screenWidth * 0.15,
        borderRadius: metrics.screenWidth * 0.15 / 2,
    },
    header: {
        backgroundColor: EDColors.white,
        borderRadius: 16,
        padding: 10,
        elevation: 1,
        justifyContent: "space-between",
        alignItems: "center"
    },
    earning: {
        flex: 1,
        marginVertical: 5,
        backgroundColor: EDColors.white,
        borderRadius: 16,
        marginTop: 10
    },
    walletHeader: {
        fontFamily: EDFonts.semiBold,
        fontSize: getProportionalFontSize(18),
        color: EDColors.black,
        // textAlign: isRTLCheck() ? 'right' : 'left'
    },
    walletText: {
        fontFamily: EDFonts.semiBold,
        fontSize: getProportionalFontSize(32),
        color: EDColors.black,
        marginTop: 5
        // textAlign: isRTLCheck() ? 'right' : 'left'
    },
    normalHeader: {
        fontFamily: EDFonts.regular,
        fontSize: getProportionalFontSize(14),
        color: EDColors.black,
    },
    transactionContainer: {
        padding: 10,
        alignItems: "center",
        marginVertical: 5,
        justifyContent: "space-between",
        borderRadius: 6,
        flex: 1
    },
    cashIconStyle: { marginTop: 3 },
    cashIconView: { paddingHorizontal: 5 },
    currentIconStyle: { fontSize: getProportionalFontSize(32), color: EDColors.white, fontFamily: EDFonts.semiBold, textAlign: 'center' },
    walletIconView: { backgroundColor: EDColors.primary, width: metrics.screenWidth * 0.15, height: metrics.screenWidth * 0.15, borderRadius: metrics.screenWidth * 0.75, justifyContent: 'center', alignItems: 'center' },
    cashText: { fontSize: getProportionalFontSize(12), fontFamily: EDFonts.semiBold, paddingHorizontal: 5, },
    reasonDate: { marginHorizontal: 20, fontSize: getProportionalFontSize(12), marginTop: 10, fontFamily: EDFonts.boldItalic, color: EDColors.black, fontFamily: EDFonts.semiBold, },
    reasonStyle: { marginHorizontal: 20, fontSize: getProportionalFontSize(12), maxWidth: metrics.screenWidth * .5, fontFamily: EDFonts.medium, color: EDColors.blackSecondary },
    headerText: { fontFamily: EDFonts.semiBold, fontSize: getProportionalFontSize(16), color: EDColors.black },
    earningView: { alignItems: "center", justifyContent: "space-between", paddingHorizontal: 10, paddingVertical: 15, borderBottomColor: EDColors.radioSelected, borderBottomWidth: 1 },
    btnText: { fontFamily: EDFonts.semiBold, fontSize: getProportionalFontSize(16), color: EDColors.white },
    walletView: { padding: 5 }
})

export default connect(
    state => {
        return {
            titleSelected: state.navigationReducer.selectedItem,
            userToken: state.userOperations.phoneNumberInRedux,
            userID: state.userOperations.userIdInRedux,
            firstName: state.userOperations.firstName,
            lastName: state.userOperations.lastName,
            image: state.userOperations.image,
            token: state.userOperations.token,
            lan: state.userOperations.lan,
            referral_code: state.userOperations.referral_code,
            wallet_money: state.userOperations.wallet_money,
            storeURL: state.userOperations.storeURL

        };
    },
    dispatch => {
        return {
            saveWalletMoney: token => {
                dispatch(saveWalletMoneyInRedux(token))
            },
            saveNavigationSelection: dataToSave => {
                dispatch(saveNavigationSelection(dataToSave));
            },
        };
    }
)(MyWalletContainer);
