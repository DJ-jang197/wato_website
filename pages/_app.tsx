import "../styles/globals.css";
import Layout from "../components/Layout";
import { AppProps } from "next/app";
import { ModalProvider } from "../lib/ModalContext";
import { SessionProvider } from "next-auth/react";

function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
    return (
        <SessionProvider session={session}>
            <ModalProvider>
                <Layout>
                    <Component {...pageProps} />
                </Layout>
            </ModalProvider>
        </SessionProvider>
    );
}

export default MyApp;
