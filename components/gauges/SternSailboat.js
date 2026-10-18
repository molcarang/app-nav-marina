import { G, Path } from 'react-native-svg';

/** Trazados de velero-popa.svg; coordenadas originales y pivote en (320, 466). */
export default function SternSailboat({ isNightMode = false }) {
    return (
        <G fill="none" opacity={isNightMode ? 0.55 : 1}>
            <G stroke="#B5C8D8" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M317 105 204 415M323 105 436 415" />
                <Path d="M319 227 271 415M321 227 369 415" opacity={0.55} />
                <Path d="M282 239H358" strokeWidth={5} />
            </G>
            <Path d="M316 78Q320 72 324 78L326 407H314Z" fill="#F1F6FA" />
            <Path d="M319 92V383" stroke="#FFFFFF" strokeWidth={2} />
            <G stroke="#EAF2F8" strokeWidth={5} strokeLinejoin="round" strokeLinecap="round">
                <Path d="M198 425V391Q198 383 207 383H244V415" />
                <Path d="M442 425V391Q442 383 433 383H396V415" />
            </G>
            <Path d="M268 413 281 387Q320 376 359 387L372 413" fill="#EAF2F8" />
            <Path d="M283 404 289 394Q320 387 351 394L357 404Z" fill="#213B51" />
            <Path d="M181 416Q320 392 459 416L449 460Q431 500 320 510Q209 500 191 460Z" fill="#F1F6FA" />
            <Path d="M188 419Q320 398 452 419" stroke="#62D8C4" strokeWidth={5} strokeLinecap="round" />
            <Path d="M207 437Q320 451 433 437L421 465Q320 483 219 465Z" fill="#193248" />
            <Path d="M264 442V470M376 442V470" stroke="#F1F6FA" strokeWidth={6} />
            <Path d="M286 482H354" stroke="#7A96A9" strokeWidth={4} strokeLinecap="round" />
            <Path d="M307 509H333L327 541Q320 547 313 541Z" fill="#91AFC2" />
        </G>
    );
}
