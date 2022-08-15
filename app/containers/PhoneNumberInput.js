import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { connect } from 'react-redux';
import EDThemeButton from '../components/EDThemeButton';
import { strings } from '../locales/i18n';
import { EDColors } from '../utils/EDColors';
import { getProportionalFontSize, TextFieldTypes } from '../utils/EDConstants';
import metrics from '../utils/metrics';
import { EDFonts } from "../utils/EDFontConstants";
import { Icon } from 'react-native-elements'
import EDText from '../components/EDText';
import Validations from '../utils/Validations';
import ProgressLoader from "../components/ProgressLoader";
import { heightPercentageToDP } from 'react-native-responsive-screen';
import EDRTLTextInput from '../components/EDRTLTextInput';

class PhoneNumberInput extends React.PureComponent {

    constructor(props) {
        super(props);

        this.countryCode = "91"

        this.user_id = this.props.navigation.state.params != undefined
            && this.props.navigation.state.params.user_id != undefined
            && this.props.navigation.state.params.user_id !== null
            ? this.props.navigation.state.params.user_id : ''

        this.isFacebook = this.props.navigation.state.params != undefined
            && this.props.navigation.state.params.isFacebook != undefined
            && this.props.navigation.state.params.isFacebook !== null
            ? this.props.navigation.state.params.isFacebook : false

        this.social_media_id = this.props.navigation.state.params != undefined
            && this.props.navigation.state.params.social_media_id != undefined
            && this.props.navigation.state.params.social_media_id !== null
            ? this.props.navigation.state.params.social_media_id : ''

        this.isAppleLogin = this.props.navigation.state.params != undefined
            && this.props.navigation.state.params.isAppleLogin != undefined
            && this.props.navigation.state.params.isAppleLogin !== null
            ? this.props.navigation.state.params.isAppleLogin : false

        this.validationsHelper = new Validations()

    }

    componentDidMount() {
        if (this.props.countryArray !== undefined && this.props.countryArray !== null && this.props.countryArray[0] !== undefined && this.props.countryArray[0].phonecode !== undefined) {
            this.countryCode = this.props.countryArray[0].phonecode
        }
    }

    onCountrySelect = country => {
        debugLog("Country data :::::", country)
        this.countryCode = country.callingCode[0]
    }

    render() {
        return (
            <View style={styles.mainView}>

                {/* PROGRESS LOADER */}
                {this.state.isLoading ? <ProgressLoader /> : null}

                {/* SCROLL VIEW */}
                <ScrollView>

                    {/* SUB VIEW */}
                    <View style={styles.subView}>

                        {/* CANCEL ICON */}
                        <Icon
                            name={"close"}
                            size={getProportionalFontSize(28)}
                            color={EDColors.primary}
                            onPress={() => { this.props.navigation.goBack(); }}
                            containerStyle={{ marginVertical: 10, alignSelf: 'flex-start', }}
                        />

                        <EDText title={strings('addNumber')} style={{ marginTop: 30 }}
                            textStyle={{ fontSize: getProportionalFontSize(35), marginBottom: 10, fontFamily: EDFonts.bold, letterSpacing: 1 }} />

                        <EDText title={strings('addNumberMessage')} style={{ marginTop: 10 }}
                            textStyle={{ fontSize: getProportionalFontSize(20), marginBottom: 30, fontFamily: EDFonts.medium, letterSpacing: 1 }} />


                        <EDRTLTextInput
                            type={TextFieldTypes.phone}
                            icon="call"
                            initialValue={this.state.phoneNumber}
                            onChangeText={this.onChangeText}
                            placeholder={strings('phone')}
                            onCountrySelect={this.onCountrySelect}
                            countryData={this.props.countryArray}
                            isShowSeperator={false}
                            placeHolderTextStyle={{ height: heightPercentageToDP('6%'), color: EDColors.black, }}
                            errorFromScreen={
                                this.state.shouldPerformValidation
                                    ? this.validationsHelper.validateMobile(
                                        this.state.phoneNumber,
                                        strings('emptyPhone'),
                                        this.countryCode
                                    )
                                    : ''
                            } />

                        <EDThemeButton
                            style={{ borderRadius: 30, height: heightPercentageToDP('6%'), width: metrics.screenWidth - 40, marginTop: 20 }}
                            label={strings('addNumber')}
                            textStyle={{ fontSize: getProportionalFontSize(19), fontFamily: EDFonts.bold }}
                            isSimpleText={true}
                            onPress={this.onConfrimPressed}
                        />
                    </View>
                </ScrollView>
            </View>
        );
    }

    state = {
        phoneNumber: '',
        shouldPerformValidation: false,
        isLoading: false
    }

    onChangeText = (value) => {
        var newText = value.replace(/[^0-9\\]/g, "")
        this.setState({ phoneNumber: newText })
    }

    onConfrimPressed = () => {
        this.setState({ shouldPerformValidation: true })
        if (this.validationsHelper.validateMobile(this.state.phoneNumber, strings("emptyPhone"), this.countryCode).trim() !== "") {
            return
        } else {
            this.props.navigation.navigate('OTPVerification', {
                isFacebook: this.isFacebook,
                user_id: this.user_id,
                phNo: this.state.phoneNumber,
                social_media_id: this.isAppleLogin ? this.props.appleToken : this.social_media_id,
                isFromLogin: true,
                phoneCode: this.countryCode,
                isAppleLogin: this.isAppleLogin
            })
        }
    }

}

const styles = StyleSheet.create({
    mainView: {
        flex: 1,
    },
    subView: {
        marginVertical: 10, marginTop: metrics.statusbarHeight + 10, marginHorizontal: 25
    }
})

export default connect(
    state => {
        return {
            lan: state.userOperations.lan,
            code: state.userOperations.code,
            countryArray: state.userOperations.countryArray,
            appleToken: state.userOperations.appleToken,
        };
    },
    dispatch => { return {} }
)(PhoneNumberInput);
