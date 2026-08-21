import type { Config } from "../config";

// Wordle 图片生成所用的 HTML 模板与样式常量。

export const htmlSuffix = `</div>
      </main>
    </div>
  </div>
</div>
</body>
</html>
`;

export const htmlPrefix = `<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Wordle</title>

    <style>

        .pz-error__message h1 {
            font-style: normal;
            font-size: 2em;
            font-size: min(2em, 90px);
            line-height: 1.15;
            font-weight: 700;
            margin-bottom: 25px
        }

        .pz-error__message p {
            font-size: 1.125em;
            line-height: 1.39;
            margin-bottom: 30px;
            max-width: 510px
        }


        .pz-error__stack-trace pre {
            white-space: normal
        }

        button, input, optgroup, select, textarea {
            font-family: inherit;
            font-size: 100%;
            line-height: 1.15;
            margin: 0
        }

        button, input {
            overflow: visible
        }

        button, select {
            text-transform: none
        }

        button, [type=button], [type=reset], [type=submit] {
            -webkit-appearance: button
        }

        html, body, div, span, applet, object, iframe, h1, h2, h3, h4, h5, h6, p, blockquote, pre, a, abbr, acronym, address, big, cite, code, del, dfn, em, img, ins, kbd, q, s, samp, small, strike, strong, sub, sup, tt, var, b, u, i, center, dl, dt, dd, ol, ul, li, fieldset, form, label, legend, table, caption, tbody, tfoot, thead, tr, th, td, article, aside, canvas, details, embed, figure, figcaption, footer, header, hgroup, menu, nav, output, ruby, section, summary, time, mark, audio, video {
            margin: 0;
            padding: 0;
            border: 0;
            font-size: 100%;
            font: inherit;
            vertical-align: baseline
        }

        article, aside, details, figcaption, figure, footer, header, hgroup, menu, nav, section {
            display: block
        }

        body {
            line-height: 1
        }

        ol, ul {
            list-style: none
        }

        blockquote, q {
            quotes: none
        }

        blockquote:before, blockquote:after, q:before, q:after {
            content: "";
            content: none
        }

        table {
            border-collapse: collapse;
            border-spacing: 0
        }

        @font-face {
            font-family: "nyt-franklin";
            src: url("./assets/Wordle/franklin-normal-700.woff2") format("woff2");
            font-weight: 700;
            font-style: normal
        }

        :root {
            --green: #6aaa64;
            --green-4: #538d4e;
            --wordle-high-contrast-green: #58a351;
            --spellingBeeYellow: #f7da21;
            --miniCrosswordBlue: #95befa;
            --connectionsPeriwinkle: #b4a8ff;
            --sudoku-orange: #fb9b00;
            --tiles-green: #b5e352;
            --dailyCrosswordBlue: #6493e6;
            --yellow-3: #c9b458;
            --yellow-4: #b59f3b;
            --newsGray-10: #dfdfdf;
            --newsGray-100: #121212;
            --newsGray-85: #363636;
            --gray-3: #ccc;
            --gray-4: #dcdcdc;
            --gray-6: #f4f4f4;
            --gray-13: #d3d6da;
            --gray-18: #787c7e;
            --gray-19: #878a8c;
            --gray-20: #edeff1;
            --gray-21: #f6f7f8;
            --gray-22: #e3e3e1;
            --gray-23: #a6a6a6;
            --gray-24: #818384;
            --gray-25: #565758;
            --gray-26: #3a3a3c;
            --gray-27: #424242;
            --gray-28: #59595a;
            --gray-29: #afafaf;
            --black: #000;
            --white: #fff;
            --newsDarkContentPrimary: #f8f8f8;
            --wordleBlack: #212121;
            --wordleBlack-2: #272729;
            --wordleBlack-3: #1a1a1b;
            --wordleBlack-4: #121213;
            --wordleBlack-5: #2f2f31;
            --linkBlue: #346eb7;
            --linkDarkBlue: #6ba1dd;
            --orange: #f5793a;
            --blue: #85c0f9;
            --outlineBlue: #2671dc;
            --svg-arrow-fill: var(--white);
            --svg-arrow-stroke: var(--black);
            --svg-arrow-fill-hover: var(--black);
            --svg-arrow-stroke-hover: var(--white)
        }

        :root {
            --color-tone-1: var(--black);
            --color-tone-2: var(--gray-18);
            --color-tone-3: var(--gray-19);
            --color-tone-4: var(--gray-13);
            --color-tone-5: var(--gray-20);
            --color-tone-6: var(--gray-21);
            --color-tone-7: var(--white);
            --color-tone-8: var(--newsGray-100);
            --color-tone-9: var(--newsGray-10);
            --color-tone-10: var(--black);
            --color-tone-11: var(--gray-18);
            --color-tone-12: var(--newsGray-85);
            --color-nav-hover: var(--gray-6);
            --opacity-50: rgba(255, 255, 255, 0.5);
            --error-background: var(--gray-22);
            --icon-disabled: var(--gray-23);
            --background-gray: var(--gray-29);
            --inline-links: var(--linkBlue);
            --warning-red: #d0021b
        }

        .dark {
            --color-tone-1: var(--newsDarkContentPrimary);
            --color-tone-2: var(--gray-24);
            --color-tone-3: var(--gray-25);
            --color-tone-4: var(--gray-26);
            --color-tone-5: var(--wordleBlack-2);
            --color-tone-6: var(--wordleBlack-3);
            --color-tone-7: var(--wordleBlack-4);
            --color-tone-8: var(--newsDarkContentPrimary);
            --color-tone-9: var(--gray-27);
            --color-tone-10: var(--newsGray-10);
            --color-tone-11: var(--newsGray-10);
            --color-tone-12: var(--newsGray-10);
            --color-nav-hover: var(--wordleBlack-5);
            --opacity-50: rgba(0, 0, 0, 0.5);
            --error-background: var(--color-tone-7);
            --icon-disabled: var(--gray-28);
            --svg-arrow-fill: var(--black);
            --svg-arrow-stroke: var(--white);
            --svg-arrow-fill-hover: var(--white);
            --svg-arrow-stroke-hover: var(--black);
            --inline-links: var(--linkDarkBlue);
            --warning-red: #ea7980
        }

        :root, .dark {
            --color-background: var(--color-tone-7)
        }

        :root {
            --color-present: var(--yellow-3);
            --color-correct: var(--green);
            --color-absent: var(--color-tone-2);
            --tile-text-color: var(--color-tone-7);
            --key-text-color: var(--color-tone-1);
            --key-evaluated-text-color: var(--color-tone-7);
            --key-bg: var(--color-tone-4);
            --key-bg-present: var(--color-present);
            --key-bg-correct: var(--color-correct);
            --key-bg-absent: var(--color-absent);
            --key-evaluated-text-color: var(--color-tone-7);
            --key-evaluated-text-color-absent: var(--white);
            --modal-content-bg: var(--color-tone-7);
            --outline-focus: var(--outlineBlue);
            --color-correct-high-contrast: var(--wordle-high-contrast-green)
        }

        @font-face {
            font-family: "nyt-franklin";
            src: url("./assets/Wordle/franklin-normal-700.woff2") format("woff2");
            font-weight: 700;
            font-style: normal
        }

        html {
            height: 100%
        }

        body {
            height: 100%;
            background-color: var(--color-background);
            margin: 0;
            padding: 0;
            overflow-y: hidden
        }

        html, body {
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale
        }

        button:focus-visible, a:focus-visible {
            outline: 2px solid var(--outline-focus)
        }

        @media (min-width: 415px) {
            :root {
                --header-height: 65px
            }
        }

        @media (min-width: 1024px) {
            :root {
                --header-padding-x: 24px
            }
        }

        @media (min-width: 768px) {
            :root {
                --header-padding-x: 20px
            }
        }

        /*# sourceMappingURL=wordle.e3c9f95c41d06668a615.css.map*/

    </style>
    <style>
        .MomentSystem-module_moment__G9hyw {
            position: absolute;
            width: 100%;
            height: 100%;
            top: 0;
            left: 0
        }


        .LandscapeWarning-module_landscapeWarning__MFIwn i {
            height: 30%;
            width: 20%;
            margin: 2rem
        }

        .LandscapeWarning-module_landscapeWarning__MFIwn p {
            font-family: "nyt-franklin";
            font-weight: 500;
            margin: 0;
            font-size: 16px;
            font-size: 1rem;
            line-height: 20.8px;
            line-height: 1.3rem
        }

        .LandscapeWarning-module_landscapeWarning__MFIwn span {
            font-family: "nyt-franklin";
            font-weight: 700
        }


        .dark before {
            background: var(--hybrid-back-dark-mode) center no-repeat;
            background-position-x: 0px
        }

        .NonDismissalBanner-module_banner__CqPDp .NonDismissalBanner-module_bannerInformation__hwApG i {
            min-height: 35px;
            min-width: 35px
        }

        .NonDismissalBanner-module_banner__CqPDp .NonDismissalBanner-module_bannerInformation__hwApG.NonDismissalBanner-module_bannerMessageIcon__xCwfD i {
            min-height: 20px;
            min-width: 20px
        }

        .NonDismissalBanner-module_banner__CqPDp .NonDismissalBanner-module_bannerBody__ZtWzl h3 {
            font-size: 14px;
            font-size: 0.875rem;
            line-height: 18.2px;
            line-height: 1.1375rem;
            font-weight: 700;
            margin: 0
        }



        .NonDismissalBanner-module_banner__CqPDp .NonDismissalBanner-module_bannerBody__ZtWzl p {
            font-size: 16px;
            font-size: 1rem;
            line-height: 20.8px;
            line-height: 1.3rem
        }

        .NonDismissalBanner-module_banner__CqPDp a {
            color: inherit;
            text-decoration: none
        }




        .NonDismissalBanner-module_multiIconBannerTest__t8tvf button.NonDismissalBanner-module_iconButtonTest__oaGgl i {
            margin-right: 0
        }



        .NonDismissalBanner-module_multiIconBannerTest__t8tvf .NonDismissalBanner-module_bannerInformationTest__Q0Dqp i {
            min-height: 25px;
            min-width: 25px
        }


        .NonDismissalBanner-module_multiIconBannerTest__t8tvf .NonDismissalBanner-module_bannerBodyTest__UrtZZ h3 {
            font-size: .85rem;
            font-weight: 700;
            margin: 0
        }

        .NonDismissalBanner-module_multiIconBannerTest__t8tvf a {
            color: inherit;
            text-decoration: none
        }


        .LargeCTABanner-module_playButton__if85L i {
            width: 27px;
            height: 27px;
            border-radius: 7px
        }

        .LargeCTABanner-module_iconTextWrapper__goI7a + i {
            position: absolute;
            right: 10px
        }



        .Skip-module_skipButton__m8KJ8 svg {
            margin-left: .5rem
        }


        :root {
            --inter-ad-skip-button-height: 52px;
            --inter-ad-top-bar-height: 34px;
            --inter-ad-bottom-bar-height: 24px
        }

        .AdInterstitial-module_adSlug__lH065 h3 {
            font-family: "nyt-franklin";
            font-weight: 500;
            font-size: 12px;
            line-height: 12px;
            margin: 12px auto 10px;
            letter-spacing: .08em;
            text-transform: uppercase;
            color: #5a5a5a;
            font-style: normal
        }

        .Welcome-module_buttonContainer__K4GEw a {
            all: inherit
        }

        .Welcome-module_back__cUvW3 button::before {
            background: var(--hybrid-back) center no-repeat !important;
            background-position-x: 0px !important
        }

        .Tile-module_tile__UWEHN {
            font-family: "nyt-franklin";
            width: 100%;
            display: inline-flex;
            justify-content: center;
            align-items: center;
            font-size: 3rem;
            line-height: 1;
            font-weight: bold;
            vertical-align: middle;
            box-sizing: border-box;
            color: var(--tile-text-color);
            text-transform: uppercase;
            -webkit-user-select: none;
            -moz-user-select: none;
            user-select: none
        }

        .Tile-module_tile__UWEHN::before {
            content: "";
            display: inline-block;
            padding-bottom: 100%
        }

        @media (max-height: 600px) {
            .Tile-module_tile__UWEHN {
                font-size: 1em
            }
        }

        .Tile-module_tile__UWEHN[data-state=empty] {
            border: 2px solid var(--color-tone-4)
        }

        .Tile-module_tile__UWEHN[data-state=tbd] {
            background-color: var(--color-tone-7);
            border: 2px solid var(--color-tone-3);
            color: var(--color-tone-1)
        }

        .Tile-module_tile__UWEHN[data-state=correct] {
            background-color: var(--color-correct);
            color: var(--key-evaluated-text-color)
        }

        .Tile-module_tile__UWEHN[data-state=present] {
            background-color: var(--color-present);
            color: var(--key-evaluated-text-color)
        }

        .Tile-module_tile__UWEHN[data-state=absent] {
            background-color: var(--color-absent);
            color: var(--key-evaluated-text-color-absent)
        }

        .Tile-module_tile__UWEHN[data-animation=pop] {
            animation-name: Tile-module_PopIn__CmX51;
            animation-duration: 100ms
        }

        .Tile-module_tile__UWEHN[data-animation=flip-in] {
            animation-name: Tile-module_FlipIn__PCdh1;
            animation-duration: 250ms;
            animation-timing-function: ease-in
        }

        .Tile-module_tile__UWEHN[data-animation=flip-out] {
            animation-name: Tile-module_FlipOut__xeJcb;
            animation-duration: 250ms;
            animation-timing-function: ease-in
        }


        .Board-module_boardContainer__TBHNL {
            display: flex;
            justify-content: center;
            align-items: center;
            flex-grow: 1;
            overflow: hidden
        }

        .Help-module_instructions__uXsG6 li {
            margin-bottom: 4px
        }

        .Help-module_instructions__uXsG6 li::marker {
            font-size: 18px
        }


        .Help-module_examples__W3VXL strong {
            font-weight: bold
        }

        .Help-module_examples__W3VXL p {
            margin: 0;
            font-size: 16px;
            line-height: 20px
        }


        .Help-module_example__gldBI p {
            font-size: 16px;
            line-height: 20px;
            margin-top: 8px
        }


        .Help-module_reminderSignUp__oQ42D a {
            color: var(--inline-links);
            -webkit-text-decoration: underline var(--inline-links);
            text-decoration: underline var(--inline-links)
        }



        .Help-module_statsLogin__HkQec button {
            border: none;
            background-color: rgba(0, 0, 0, 0);
            font-family: "nyt-franklin";
            font-size: 16px;
            line-height: 20px;
            text-align: left;
            padding: 0px 0px 3px
        }

        .Help-module_statsLogin__HkQec a, .Help-module_statsLogin__HkQec button {
            color: var(--inline-links);
            -webkit-text-decoration: underline var(--inline-links);
            text-decoration: underline var(--inline-links)
        }


        .MiniAuthCTA-module_buttonsContainer__IoQWk .MiniAuthCTA-module_loginButton__x7_fR > a {
            color: inherit
        }


        .Stats-module_statsBtnLeft__IyDkc h1 {
            display: inline-block
        }

        .Stats-module_statsBtnLeft__IyDkc button {
            margin-left: 10px
        }

        .Footer-module_textContainer__LWkeW > p {
            margin: 5px
        }


        .Footer-module_buttonsContainer__YNxCQ .Footer-module_loginButton__abKD3 > a {
            color: inherit;
            text-decoration: none
        }


        .Footer-module_sbButtonFooter__X3LsB .Footer-module_nextWordle__Bzpb0 span {
            margin-right: 4px
        }


        .Footer-module_sbButtonFooter__X3LsB .Footer-module_sbPlayButton__kNigc span {
            color: #121212;
            letter-spacing: normal
        }

        .BotLink-module_botLink__uRdNy .BotLink-module_botLinkContent__RR4ri p {
            font: 700 14px/17.5px "nyt-franklin";
            margin: 0
        }

        .BotLink-module_botLink__uRdNy .BotLink-module_botLinkContent__RR4ri p span {
            font-weight: 400;
            text-decoration: underline
        }

        @media (max-height: 548px) {
            .driveToMore .BotLink-module_botLink__uRdNy .BotLink-module_botLinkContent__RR4ri p {
                font-size: 13px
            }
        }



        .HardModeAwareness-module_settingsButton__DGkRg svg {
            width: 12px;
            height: 12px;
            margin: 1px 0 0 5px;
            display: inline-block
        }

        #hardModeAwareness-dialog > div:first-child {
            padding: 0;
            max-width: 440px
        }

        @media (max-width: 500px) {
            #hardModeAwareness-dialog > div:first-child {
                width: 90%;
                height: auto;
                min-height: unset;
                align-self: center
            }
        }


        .ActivationRegiModal-module_loginLink__qqJOJ > a {
            color: inherit;
            text-decoration: none
        }


        .driveToMore h4 {
            font: 700 0.6875rem/0.859375rem "nyt-franklin";
            letter-spacing: .05em;
            border-top: solid 2px var(--color-tone-1);
            padding-top: 10px;
            margin: 0 auto 18px;
            width: calc(100% - 50px);
            display: none
        }

        @media (min-height: 548px) {
            .driveToMore h4 {
                display: block
            }
        }

        @media (min-width: 768px) {
            .driveToMore h4 {
                width: calc(100% - 100px)
            }
        }


        @media (min-width: 768px) {

            .driveToMore .DriveToMoreContent-module_fitContent__h6S25 h4 {
                width: 100%
            }
        }

        .driveToMore .DriveToMoreContent-module_fitContentGrid__TDzaq h4 {
            width: auto
        }

        .driveToMore .DriveToMoreContent-module_carouselGameItem__ypawW p, .driveToMore .DriveToMoreContent-module_gamesGridItem__hJIku p {
            font: 700 0.875rem/1.1875rem "nyt-karnakcondensed";
            margin: 5px 0 2px
        }

        @media (min-height: 548px) {
            .driveToMore .DriveToMoreContent-module_carouselGameItem__ypawW p, .driveToMore .DriveToMoreContent-module_gamesGridItem__hJIku p {
                font-size: 1rem
            }
        }

        @media (min-width: 768px) {
            .driveToMore .DriveToMoreContent-module_carouselGameItem__ypawW p, .driveToMore .DriveToMoreContent-module_gamesGridItem__hJIku p {
                font-size: 1rem
            }
        }

        .driveToMore .DriveToMoreContent-module_carouselGameItem__ypawW span, .driveToMore .DriveToMoreContent-module_gamesGridItem__hJIku span {
            font: 500 0.75rem/1rem "nyt-franklin"
        }

        @media (min-height: 548px) {
            .driveToMore .DriveToMoreContent-module_carouselGameItem__ypawW span, .driveToMore .DriveToMoreContent-module_gamesGridItem__hJIku span {
                font-size: 0.875rem;
                line-height: 1.125rem
            }
        }

        @media (min-width: 992px) {
            .driveToMore .DriveToMoreContent-module_carouselGameItem__ypawW span, .driveToMore .DriveToMoreContent-module_gamesGridItem__hJIku span {
                font-size: 0.75rem
            }
        }


        .NewsCarousel-module_carouselNewsItem__iTjNZ p {
            font: 500 0.875rem/1.09375rem nyt-cheltenham, Georgia;
            color: var(--color-tone-1);
            margin-top: 8px
        }

        img {
            width: 100%;
            animation: NewsCarousel-module_fadeIn__XJI1h 500ms
        }


        .NewsCarousel-module_desktopCarouselNewsItem__pjK2M p {
            font: 500 1rem/1.25rem nyt-cheltenham, Georgia;
            color: var(--color-tone-1);
            margin-top: 8px
        }


        .NewsCarousel-module_carouselControl__P2VRs svg {
            width: 100%;
            height: 100%
        }

        .NewsCarousel-module_carouselControl__P2VRs:hover svg {
            fill: #dfdfdf
        }

        .Settings-module_setting__EaMz6 a, .Settings-module_setting__EaMz6 a:visited {
            color: var(--color-tone-8);
            text-decoration: underline
        }


        .Modal-module_fullscreenStatsExit__DpWAs .Modal-module_buttonContainer__aEMIr .Modal-module_closeIconButton__y9b6c svg {
            width: 100%;
            height: auto
        }

        .Modal-module_closeIcon__TcEKb svg {
            width: 100%;
            height: auto
        }


        .AppHeader-module_menuRight__Noasd button svg {
            vertical-align: middle
        }

        @media (max-width: 499px) {
            .pz-web .AppHeader-module_menuRight__Noasd.AppHeader-module_longTextVariant__guJaD svg {
                width: 20px
            }
        }

        .Explainer-module_containerLink__Eahjg p:last-child {
            font-weight: 700
        }


        .Explainer-module_text__DosQz > a {
            color: var(--inline-links);
            -webkit-text-decoration: underline var(--inline-links);
            text-decoration: underline var(--inline-links)
        }



        .Explainer-module_headerNew__y8y2y > p {
            text-align: center;
            margin: 10px 0px
        }



        .Page-module_page__Py6Ys header {
            display: flex;
            justify-content: center;
            align-items: center;
            position: relative
        }

        .Page-module_page__Py6Ys h1 {
            font-weight: 700;
            font-size: 16px;
            letter-spacing: .5px;
            text-transform: uppercase;
            text-align: center;
            margin-bottom: 10px
        }



        .Page-module_headerNew__FQAkL > p {
            text-align: center;
            margin: 10px 0px
        }




        .Error-module_errorBannerContainer__pfK75 p {
            font-weight: 400;
            margin: 5px 5px 5px 10px
        }

        .Ad-module_adContainer__ZAFEc > *:first-child {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%)
        }

        .App-module_gameContainer__K_CBh {
            position: relative
        }

        .App-module_game__yruqo {
            width: 100%;
            max-width: var(--game-max-width);
            margin: 0 auto;
            height: calc(100% - var(--header-height));
            display: flex;
            flex-direction: column
        }

        .pz-offline-ticker svg path {
            fill: var(--white)
        }

        .StatsSelectionTool-module_form__eOT7F fieldset {
            margin-bottom: 40px
        }

        .dark.colorblind {
            --color-absent: var(--color-tone-4);
            --key-bg-absent: var(--color-tone-4)
        }

        .colorblind {
            --color-correct: var(--orange);
            --color-present: var(--blue);
            --color-absent: var(--color-tone-2);
            --tile-text-color: var(--white);
            --key-bg-present: var(--color-present);
            --key-bg-correct: var(--color-correct);
            --key-bg-absent: var(--color-tone-2);
            --key-evaluated-text-color: var(--black);
            --key-evaluated-text-color-absent: var(--white);
            --color-correct-high-contrast: var(--orange);
            --modal-content-bg: var(--color-tone-7)
        }

        /*# sourceMappingURL=62.9d339ad0d09ddf80c92e.css.map*/

    </style>`;

// Wordle 图片的 body 与棋盘容器开始部分（依赖主题配置）。
export function htmlAfterStyle(config: Config): string {
  return `
</head>
<body>

<body class="${config.isDarkThemeEnabled ? "dark" : ""} ${
    config.isHighContrastThemeEnabled ? "colorblind" : ""
  }">
<div>
  <div class="MomentSystem-module_moment__G9hyw">
    <div class="App-module_gameContainer__K_CBh" data-testid="game-wrapper" style="height: calc(100% - 210px);">
      <main class="App-module_game__yruqo" id="wordle-app-game">
        <div class="Board-module_boardContainer__TBHNL" style="overflow: unset;">`;
}

// 汉兜「拼音速查表」的默认拼音表。
export const defaultPinyinsHtml = `                    <div grid="~ cols-2 gap-3" h-min="">
                        <div class="">b</div>
                        <div class="">p</div>
                        <div class="">m</div>
                        <div class="">f</div>
                        <div class="">d</div>
                        <div class="">t</div>
                        <div class="">n</div>
                        <div class="">l</div>
                        <div class="">g</div>
                        <div class="">k</div>
                        <div class="">h</div>
                        <div class="">j</div>
                        <div class="">q</div>
                        <div class="">r</div>
                        <div class="">x</div>
                        <div class="">w</div>
                        <div class="">y</div>
                        <div class="">zh</div>
                        <div class="">ch</div>
                        <div class="">sh</div>
                        <div class="">z</div>
                        <div class="">c</div>
                        <div class="">s</div>
                    </div>
                    <div grid="~ cols-3 gap-3" h-min="">
                        <div class="">a</div>
                        <div class="">ai</div>
                        <div class="">an</div>
                        <div class="">ang</div>
                        <div class="">ao</div>
                        <div class="">e</div>
                        <div class="">ei</div>
                        <div class="">en</div>
                        <div class="">eng</div>
                        <div class="">er</div>
                        <div class="">i</div>
                        <div class="">ia</div>
                        <div class="">ian</div>
                        <div class="">iang</div>
                        <div class="">iao</div>
                        <div class="">ie</div>
                        <div class="">in</div>
                        <div class="">ing</div>
                        <div class="">io</div>
                        <div class="">iong</div>
                        <div class="">iu</div>
                        <div class="">o</div>
                        <div class="">ong</div>
                        <div class="">ou</div>
                        <div class="">u</div>
                        <div class="">ua</div>
                        <div class="">uai</div>
                        <div class="">uan</div>
                        <div class="">uang</div>
                        <div class="">ui</div>
                        <div class="">un</div>
                        <div class="">uo</div>
                        <div class="">ü</div>
                        <div class="">üan</div>
                        <div class="">üe</div>
                        <div class="">ün</div>
                    </div>`;
