import { uiT, useInterfaceLanguage } from "../interface-language/runtime";
import React, {useState} from 'react';
import {Text,TouchableOpacity,View, type StyleProp,type TextStyle,type ViewStyle} from 'react-native';
import {useTheme} from '../../utils/theme';
import {formatTurkishMeaning} from './format';
export function MeaningRows({primary,alternatives,english,englishAlternatives,rowStyle,labelStyle,valueStyle}: {
 primary:string;alternatives:string[];english:string;englishAlternatives:string[];
 rowStyle?:StyleProp<ViewStyle>;labelStyle?:StyleProp<TextStyle>;valueStyle?:StyleProp<TextStyle>;
}){
  useInterfaceLanguage();
 const {theme}=useTheme();const [showOriginal,setShowOriginal]=useState(false);
 const row=[{flexDirection:'row' as const,alignItems:'flex-start' as const,marginBottom:8},rowStyle];
 const label=[{width:100,color:theme.textSecondary,fontSize:14},labelStyle];
 const value=[{flex:1,minWidth:0,color:theme.textColor,fontSize:16,fontWeight:'500' as const},valueStyle];
 const translatedAlternatives=alternatives.map(formatTurkishMeaning).join(', ');
 return <View>
  <View style={row}><Text style={label}>{uiT("ui.primary_efe10c80")}</Text><Text selectable style={value}>
   {formatTurkishMeaning(primary)}{showOriginal&&english&&<Text style={{color:theme.textSecondary,fontWeight:'normal'}}> · {english}</Text>}
  </Text></View>
  {(translatedAlternatives||showOriginal&&englishAlternatives.length>0)&&<View style={row}>
   <Text style={label}>{uiT("ui.alternative_b59b72be")}</Text><Text selectable style={value}>
    {translatedAlternatives}{showOriginal&&englishAlternatives.length>0&&<Text style={{color:theme.textSecondary,fontWeight:'normal'}}>{translatedAlternatives?' · ':''}{englishAlternatives.join(', ')}</Text>}
   </Text></View>}
  <TouchableOpacity onPress={()=>setShowOriginal(value=>!value)} accessibilityRole="button" accessibilityLabel={showOriginal?"Hide original English meanings":"Show original English meanings"} accessibilityState={{expanded:showOriginal}} style={{alignSelf:'flex-start',paddingVertical:8,marginBottom:4}}>
   <Text style={{color:theme.primary||'#3a86ff'}}>{showOriginal?uiT("ui.hide_original_english_ba0033c9"):uiT("ui.show_original_english_cad4e328")}</Text>
  </TouchableOpacity>
 </View>;
}
