'use client';

import React, { useId } from 'react';

interface AdvancedGlassFilterProps {
    displacementScale?: number;
    aberrationIntensity?: number;
    id?: string;
    mapUrl?: string;
}

/**
 * AdvancedGlassFilter provides the SVG filter definitions for the "Liquid Glass" effect.
 * It handles pixel displacement (refraction) and channel splitting (chromatic aberration).
 */
export const AdvancedGlassFilter: React.FC<AdvancedGlassFilterProps> = ({
    displacementScale = 25,
    aberrationIntensity = 2,
    id: externalId,
    mapUrl,
}) => {
    const generatedId = useId();
    const filterId = externalId || `glass-filter-${generatedId.replace(/:/g, '')}`;

    return (
        <svg style={{ position: 'absolute', width: 0, height: 0 }} aria-hidden="true">
            <defs>
                <radialGradient id={`${filterId}-edge-mask`} cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="black" stopOpacity="0" />
                    <stop offset={`${Math.max(30, 80 - aberrationIntensity * 2)}%`} stopColor="black" stopOpacity="0" />
                    <stop offset="100%" stopColor="white" stopOpacity="1" />
                </radialGradient>

                <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
                    {mapUrl ? (
                        <feImage 
                            result="DISPLACEMENT_MAP" 
                            href={mapUrl} 
                            preserveAspectRatio="none"
                            x="0" y="0" width="100%" height="100%"
                        />
                    ) : (
                        <feTurbulence
                            type="fractalNoise"
                            baseFrequency="0.02"
                            numOctaves="2"
                            stitchTiles="stitch"
                            result="DISPLACEMENT_MAP"
                        />
                    )}

                    {/* Single Displacement for base refraction - much more performant than 3 */}
                    <feDisplacementMap 
                        in="SourceGraphic" 
                        in2="DISPLACEMENT_MAP" 
                        scale={displacementScale} 
                        xChannelSelector="R" 
                        yChannelSelector="B" 
                        result="BASE_DISPLACED" 
                    />

                    {/* Simple Chromatic Aberration: Just shift the R and B channels slightly */}
                    {/* This avoids 3 displacement maps while still giving the "glass" separation look */}
                    <feColorMatrix
                        in="BASE_DISPLACED"
                        type="matrix"
                        values="1 0 0 0 0
                                0 0 0 0 0
                                0 0 0 0 0
                                0 0 0 1 0"
                        result="RED_ONLY"
                    />
                    <feOffset in="RED_ONLY" dx={aberrationIntensity * 0.5} dy="0" result="RED_SHIFTED" />

                    <feColorMatrix
                        in="BASE_DISPLACED"
                        type="matrix"
                        values="0 0 0 0 0
                                0 1 0 0 0
                                0 0 0 0 0
                                0 0 0 1 0"
                        result="GREEN_ONLY"
                    />

                    <feColorMatrix
                        in="BASE_DISPLACED"
                        type="matrix"
                        values="0 0 0 0 0
                                0 0 0 0 0
                                0 0 1 0 0
                                0 0 0 1 0"
                        result="BLUE_ONLY"
                    />
                    <feOffset in="BLUE_ONLY" dx={-aberrationIntensity * 0.5} dy="0" result="BLUE_SHIFTED" />

                    {/* Combine shifted channels with careful alpha handling */}
                    <feBlend in="RED_SHIFTED" in2="GREEN_ONLY" mode="screen" result="RG_COMBINED" />
                    <feBlend in="RG_COMBINED" in2="BLUE_SHIFTED" mode="screen" result="FINAL_DISPLACED" />

                    {/* Subtle blur to blend the shifts */}
                    <feGaussianBlur in="FINAL_DISPLACED" stdDeviation="0.3" result="BLURRED" />
                    
                    {/* Return the blurred, displaced image directly */}
                    {/* No composite over SourceGraphic to avoid ghosting/double-vision */}
                </filter>
            </defs>
        </svg>
    );
};
