import Document, { Head, Main, NextScript } from "next/document";
import { ServerStyleSheet } from "styled-components";
import $ from "jquery";
import Script from "react-load-script";

export default class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx);
    const sheet = new ServerStyleSheet();
    const page = ctx.renderPage(App => props =>
      sheet.collectStyles(<App {...props} />)
    );
    const styleTags = sheet.getStyleElement();
    return {
      ...initialProps,
      ...page,
      styleTags,
      namespacesRequired: ["common"]
    };
  }

  render() {
    const { buildManifest, assetPrefix } = this.props;
    const { css } = buildManifest;
    return (
      <html lang="en">
        <Head>
          <meta name="viewport" content="width=device-width,initial-scale=1" />
          <meta name="google" content="notranslate" />
          <link
            rel="apple-touch-icon"
            sizes="120x120"
            href={`${assetPrefix}/static/favicon/apple-touch-icon.png`}
          />
          <link
            rel="icon"
            type="image/png"
            sizes="32x32"
            href={`${assetPrefix}/static/favicon/favicon-32x32.png`}
          />
          <link
            rel="icon"
            type="image/png"
            sizes="16x16"
            href={`${assetPrefix}/static/favicon/favicon-16x16.png`}
          />
          <link
            rel="manifest"
            href={`${assetPrefix}/static/favicon/site.webmanifest`}
          />
          <link
            rel="mask-icon"
            href={`${assetPrefix}/static/favicon/safari-pinned-tab.svg`}
            color="#5bbad5"
          />
          <meta name="msapplication-TileColor" content="#da532c" />
          <meta name="theme-color" content="#ffffff" />
          <meta name="description" content="Docker7.7.9" />

          <link
            rel="stylesheet"
            type="text/css"
            href={`${assetPrefix}/static/nprogress.css`}
          />
          <link
            rel="stylesheet"
            type="text/css"
            href={`${assetPrefix}/static/customcss/blockui.css`}
          />
          <link
            rel="stylesheet"
            type="text/css"
            href={`${assetPrefix}/static/customcss/Typeahead.css`}
          />
          <link
            rel="stylesheet"
            type="text/css"
            href={`${assetPrefix}/static/customcss/react-notification-component.css`}
          />

          <link
            rel="stylesheet"
            type="text/css"
            href={`${assetPrefix}/static/cs/style.css`}
          />
          <link
            rel="stylesheet"
            type="text/css"
            href={`${assetPrefix}/static/customcss/fixed.css`}
          />
          <link
            rel="stylesheet"
            type="text/css"
            href={`${assetPrefix}/static/customcss/responsive.css`}
          />
          <link
            rel="stylesheet"
            type="text/css"
            href={`${assetPrefix}/static/customcss/react-datepicker.min.css`}
          />
          <link
            rel="stylesheet"
            type="text/css"
            href={`${assetPrefix}/static/cs/datatableDetail.css`}
          />
          <link
            rel="stylesheet"
            type="text/css"
            href={`${assetPrefix}/static/cs/dayPicker.css`}
          />
          <link
            rel="stylesheet"
            type="text/css"
            href={`${assetPrefix}/static/customcss/field.css`}
          />
          <link
            rel="stylesheet"
            type="text/css"
            href={`${assetPrefix}/static/customcss/sweetalert.css`}
          />
          <link
            rel="stylesheet"
            type="text/css"
            href={`${assetPrefix}/static/customcss/flag-icon.min.css`}
          />
        </Head>
        <body ref="body">
          <Main />
          <NextScript />
          <script src={`${assetPrefix}/static/js/jquery.min.js`} />
          <script src={`${assetPrefix}/static/js/modernizr.js`} />
          <script src={`${assetPrefix}/static/js/app.js`} />
          <script
            src={`https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/6.10.3/babel.min.js`}
          />
          <link
            rel="stylesheet"
            type="text/css"
            href={`${assetPrefix}/static/fixedHeader.bootstrap.css`}
          />
        </body>
      </html>
    );
  }
}
