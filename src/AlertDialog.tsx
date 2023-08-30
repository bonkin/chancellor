import { Dialog, Transition } from '@headlessui/react';
import {Component, Fragment} from 'react';

interface AlertDialogProps {
    isDialogOpen: boolean;
    onClose: () => void;
}

class AlertDialog extends Component<AlertDialogProps> {
    render() {
        let {isDialogOpen, onClose} = this.props;
        return (
            isDialogOpen && (
                <Transition appear show={isDialogOpen} as={Fragment}>
                    <Dialog as="div" className="fixed inset-0 z-10 overflow-y-auto" onClose={onClose}>
                        <div className="min-h-screen px-4 text-center">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0"
                                enterTo="opacity-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100"
                                leaveTo="opacity-0"
                            >
                                <Dialog.Overlay className="fixed inset-0 bg-black opacity-30"/>
                            </Transition.Child>

                            <span className="inline-block h-screen align-middle" aria-hidden="true">&#8203;</span>

                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <div
                                    className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
                                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                                        Access Token Missing
                                    </Dialog.Title>
                                    <div className="mt-2">
                                        <p className="text-sm text-gray-500">
                                            It is recommended to log in to your Lichess account to use this app for an optimized experience.
                                            Please be aware that both logged-in and guest users are subject to API rate limitations from Lichess.
                                        </p>
                                    </div>
                                    <div className="mt-4">
                                        <button
                                            type="button"
                                            className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
                                            onClick={onClose}
                                        >
                                            Got it
                                        </button>
                                    </div>
                                </div>
                            </Transition.Child>
                        </div>
                    </Dialog>
                </Transition>
            )
        );
    }
}

export default AlertDialog;
