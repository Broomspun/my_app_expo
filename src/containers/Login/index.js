/**
 * Created by InspireUI on 19/02/2017.
 */
import React, {Component, PropTypes} from 'react';
import {View, ScrollView, Text, StyleSheet, Image, TextInput, TouchableOpacity} from 'react-native';
import {connect} from 'react-redux';

import {Icons, Color, Languages, Styles, Images} from "@common";
import {Icon, toast, log, warn, FacebookAPI} from '@app/Omni';
import {Spinner, Button, ButtonIndex} from '@components';

import WooWorker from '@services/WooWorker';
import WPUserAPI from '@services/WPUserAPI';

class LoginScreen extends Component {
    constructor(props) {
        super(props);
        this.state = {
            username: '',
            password: '',
            isLoading: false,
            logInFB: false,
        };

        this.onLoginPressHandle = this.onLoginPressHandle.bind(this);
        this.onFBLoginPressHandle = this.onFBLoginPressHandle.bind(this);
        this.checkConnection = this.checkConnection.bind(this);
        this.onSignUpHandle = this.onSignUpHandle.bind(this);
        this.stopAndToast = this.stopAndToast.bind(this);

        this.onUsernameEditHandle = username => this.setState({username});
        this.onPasswordEditHandle = password => this.setState({password});

        this.focusPassword = () => this.refs.password && this.refs.password.focus();
    }

    // handle the logout screen and navigate to cart page if the new user login object exist
    async componentWillReceiveProps(nextProps) {
        const {onViewCartScreen, logout, user: oldUser, onViewHomeScreen} = this.props;

        const {user} = nextProps.user;
        const {params} = nextProps.navigation.state;

        // check case after logout
        if (user && params && params.isLogout) {
            logout();
            if (this.state.logInFB) {
                if (FacebookAPI.getAccessToken()) {
                    FacebookAPI.logout();
                }
            }
            onViewHomeScreen();
        }

        // check case after login
        if (user != null && oldUser.user == null) {
            await this.setState({isLoading: false});

            if (params.onCart) {
                onViewCartScreen()
            }
            else {
                onViewHomeScreen();
            }
            const uName = user.last_name != null || user.first_name != null ? user.last_name + ' ' + user.first_name : user.name;
            toast(Languages.welcomeBack + ` ${uName}.`);
        }
    }

    async onLoginPressHandle() {
        const {login, netInfo, navigation} = this.props;
        if (!netInfo.isConnected) return toast('No connection');
        const {username, password, isLoading} = this.state;
        if (isLoading) return;
        this.setState({isLoading: true});
        const json = await WPUserAPI.login(username.trim(), password);
        if (json === undefined) {
            this.stopAndToast('Can\'t get data from server');
        } else if (json.error) {
            this.stopAndToast(json.error);
        } else {
            const customers = await WooWorker.getCustomerById(json.user.id);
            // console.log("customers", customers);

            login(customers);
        }
    }

    onFBLoginPressHandle() {
        var self = this;
        const {login, onViewSignUp} = self.props;
        // const callback = async(user) => {

        //   const user = await WooWorker.getCustomerByEmail(user.email);
        //   if (user.length > 0) {
        //     this.setState({isLoading: false});
        //     login(customer); //there is a customer with this email
        //   } else {
        //     this.setState({isLoading: false});
        //     console.log("user", user);
        //     return onViewSignUp({
        //       user: {
        //         email: user.email,
        //         firstName: user.first_name,
        //         lastName: user.last_name,
        //        }
        //     });
        //   }
        // };
        this.setState({isLoading: true});

        //
        FacebookAPI.login()
            .then(async user => {
                // console.log("User last:::", user);
                if (user) {
                    const customer = await WooWorker.getCustomerByEmail(user.email);
                    if (customer.length > 0) {
                        self.setState({isLoading: false});
                        login(customer[0]); //there is a customer with this email
                    } else {
                        self.setState({isLoading: false});
                        onViewSignUp({
                            user: {
                                email: user.email,
                                firstName: user.first_name,
                                lastName: user.last_name,
                            }
                        });
                    }
                }
            }).catch(err => {
            self.setState({isLoading: true});
            error(err)
        });


    }

    onSignUpHandle() {
        this.props.onViewSignUp();
    }

    checkConnection() {
        const {netInfo} = this.props;
        if (!netInfo.isConnected) toast('No connection');
        return netInfo.isConnected;
    }

    stopAndToast(msg) {
        toast(msg);
        this.setState({isLoading: false});
    }

    render() {
        const {username, password, isLoading} = this.state;
        return (
            <ScrollView style={styles.container}>
              <View style={styles.logoWrap}>
                <Image source={Images.logoWithText} style={styles.logo} resizeMode={'contain'}/>
              </View>
              <View style={styles.subContain}>
                <View style={styles.loginForm}>
                  <View style={styles.inputWrap}>
                    <Icon name={Icons.MaterialCommunityIcons.Email} size={Styles.IconSize.TextInput}
                          color={Color.blackTextSecondary}/>
                    <TextInput
                        {...commonInputProps}
                        ref="username"
                        placeholder={'Username or email'}
                        keyboardType={'email-address'}
                        onChangeText={this.onUsernameEditHandle}
                        onSubmitEditing={this.focusPassword}
                        returnKeyType={'next'}
                        value={username}
                    />
                  </View>
                  <View style={styles.inputWrap}>
                    <Icon name={Icons.MaterialCommunityIcons.Lock} size={Styles.IconSize.TextInput}
                          color={Color.blackTextSecondary}/>
                    <TextInput
                        {...commonInputProps}
                        ref="password"
                        placeholder={'Password'}
                        secureTextEntry={true}
                        onChangeText={this.onPasswordEditHandle}
                        returnKeyType={'go'}
                        value={password}
                    />
                  </View>
                  <ButtonIndex text="LOGIN"
                               containerStyle={styles.loginButton}
                               onPress={this.onLoginPressHandle}
                  />
                </View>
                <View style={styles.separatorWrap}>
                  <View style={styles.separator}/>
                  <Text style={styles.separatorText}>Or</Text>
                  <View style={styles.separator}/>

                </View>

                <ButtonIndex text="FACEBOOK LOGIN" icon={Icons.MaterialCommunityIcons.Facebook}
                             containerStyle={styles.fbButton}
                             onPress={this.onFBLoginPressHandle}

                />
                <TouchableOpacity
                    style={Styles.Common.ColumnCenter}
                    onPress={this.onSignUpHandle}>
                  <Text style={styles.signUp}>
                    Don't have an account? <Text style={styles.highlight}>Sign Up</Text>
                  </Text>
                </TouchableOpacity>
              </View>

                {isLoading ? <Spinner mode={'overlay'}/> : null}
            </ScrollView>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Color.background,
        paddingTop: 50,
        paddingBottom: 100
    },
    logoWrap: {
        ...Styles.Common.ColumnCenter,
        flexGrow: 1,
    },
    logo: {
        width: Styles.width * 0.8,
        height: (Styles.width * 0.8) / 2,
    },
    subContain: {
        paddingHorizontal: Styles.width * 0.1,
        paddingBottom: 50,
    },
    loginForm: {},
    inputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        borderColor: Color.blackDivide,
        borderBottomWidth: 1,
    },
    input: {
        borderColor: '#9B9B9B',
        height: 40,
        marginTop: 10, marginLeft: 10,
        paddingHorizontal: 10, paddingTop: 0, paddingBottom: 8,
        flex: 1,
    },
    loginButton: {
        marginTop: 20,
        backgroundColor: Color.primary,
        borderRadius: 5,
        elevation: 1,
    },
    separatorWrap: {
        paddingVertical: 15,
        flexDirection: 'row',
        alignItems: 'center'
    },
    separator: {
        borderBottomWidth: 1,
        flexGrow: 1,
        borderColor: Color.blackTextDisable,
    },
    separatorText: {
        color: Color.blackTextDisable,
        paddingHorizontal: 10,
    },
    fbButton: {
        backgroundColor: Color.facebook,
        borderRadius: 5,
        elevation: 1,
    },
    // ggButton: {
    //     marginVertical: 10,
    //     backgroundColor: Color.google,
    //     borderRadius: 5,
    // },
    signUp: {
        color: Color.blackTextSecondary,
        marginTop: 20,
    },
    highlight: {
        fontWeight: 'bold',
        color: Color.primary
    }
});

const commonInputProps = {
    style: styles.input,
    underlineColorAndroid: 'transparent',
    placeholderTextColor: Color.blackTextSecondary,
};


LoginScreen.propTypes = {
    netInfo: PropTypes.object,
    login: PropTypes.func.isRequired,
    logout: PropTypes.func.isRequired,
};

const mapStateToProps = ({netInfo, user}) => ({netInfo, user});

const mapDispatchToProps = (dispatch) => {
    const {actions} = require('@redux/UserRedux');
    return {
        login: (user) => dispatch(actions.login(user)),
        logout: () => dispatch(actions.logout())
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(LoginScreen);