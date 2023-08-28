import React, {Component} from 'react';
import {LichessLoginState} from './App';

export interface UserProps {
    lichessLoginState: LichessLoginState;
    lichessLoginName?: string;
    loginToLichess: () => void;
    logOutOfLichess: () => void;
}

class User extends Component<UserProps> {

    render() {
        let userInfo: React.ReactNode = null;
        let button: React.ReactNode = null;

        switch (this.props.lichessLoginState) {
            case LichessLoginState.LoggedOut:
            case LichessLoginState.Error:
                button = (
                    <button className="text-sm bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded"
                            onClick={this.props.loginToLichess}>
                        Authenticate
                    </button>
                );
                break;
            case LichessLoginState.LoggedIn:
                userInfo = <div className="text-sm mr-2">{this.props.lichessLoginName}</div>;
                button = (
                    <button className="text-sm bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded"
                            onClick={this.props.logOutOfLichess}>
                        Log out
                    </button>
                );
                break;
            case LichessLoginState.Pending:
                userInfo = <div className="text-sm mr-2">Pending</div>;
                break;
        }

        return (
            <div className="flex items-center">
                <img
                    className="w-8 h-8 rounded-full mr-2"
                    src="https://robohash.org/autemautquisquam.jpg?size=400x250&set=set1"
                    alt="Avatar of User"
                />
                {userInfo}
                {button}
            </div>
        );
    }
}

export default User;