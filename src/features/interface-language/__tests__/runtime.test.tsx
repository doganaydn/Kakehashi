import React, {useState} from "react";
import {render, fireEvent, act, waitFor} from "@testing-library/react-native";
import {Text, TextInput, View} from "react-native";
import en from "../locales/en.json";
import tr from "../locales/tr.json";
const mockValues = new Map<string,string>();
const mockSetNativeLanguage = jest.fn();
jest.mock("@react-native-async-storage/async-storage",()=>({__esModule:true,default:{
 getItem:jest.fn(async(key:string)=>mockValues.get(key)??null),
 setItem:jest.fn(async(key:string,value:string)=>{mockValues.set(key,value);}),
 removeItem:jest.fn(async(key:string)=>{mockValues.delete(key);}),
}}));
jest.mock("expo-modules-core",()=>({requireOptionalNativeModule:()=>({setInterfaceLocale:mockSetNativeLanguage})}));
import {uiT,useInterfaceLanguage,useInterfaceLanguageStore,initializeInterfaceLanguage,INTERFACE_LANGUAGE_STORAGE_KEY,formatUiDate,formatUiNumber,widgetUiLabel} from "../runtime";
const homeKey=Object.keys(en).find(k=>en[k as keyof typeof en]==="Home") as keyof typeof en;
beforeEach(()=>{mockValues.clear();mockSetNativeLanguage.mockClear();useInterfaceLanguageStore.getState().setLanguage("en");});
it("keeps English as default and changes UI without remounting answers",()=>{
 function Session(){useInterfaceLanguage();const [answer,setAnswer]=useState("");return <View><Text>{uiT(homeKey)}</Text><TextInput accessibilityLabel="Answer" value={answer} onChangeText={setAnswer}/></View>;}
 const screen=render(<Session/>);fireEvent.changeText(screen.getByLabelText("Answer"),"はし");
 expect(screen.getByText("Home")).toBeTruthy();
 act(()=>useInterfaceLanguageStore.getState().setLanguage("tr"));
 expect(screen.getByText("Ana ekran")).toBeTruthy();expect(screen.getByLabelText("Answer").props.value).toBe("はし");
 act(()=>useInterfaceLanguageStore.getState().setLanguage("en"));expect(screen.getByText("Home")).toBeTruthy();
});
it("persists UI preference independently and restores or repairs it",async()=>{
 useInterfaceLanguageStore.getState().setLanguage("tr");await waitFor(()=>expect(mockValues.has(INTERFACE_LANGUAGE_STORAGE_KEY)).toBe(true));
 const saved=mockValues.get(INTERFACE_LANGUAGE_STORAGE_KEY)!;
 useInterfaceLanguageStore.getState().setLanguage("en");mockValues.set(INTERFACE_LANGUAGE_STORAGE_KEY,saved);
 await initializeInterfaceLanguage();expect(useInterfaceLanguageStore.getState().language).toBe("tr");expect(mockSetNativeLanguage).toHaveBeenLastCalledWith("tr");
 mockValues.set(INTERFACE_LANGUAGE_STORAGE_KEY,JSON.stringify({state:{language:"unexpected"},version:0}));
 await initializeInterfaceLanguage();expect(useInterfaceLanguageStore.getState().language).toBe("en");
 expect([...mockValues.keys()]).toEqual([INTERFACE_LANGUAGE_STORAGE_KEY]);
 useInterfaceLanguageStore.getState().setLanguage("tr");
 mockValues.set(INTERFACE_LANGUAGE_STORAGE_KEY,"broken json");
 await initializeInterfaceLanguage();expect(useInterfaceLanguageStore.getState().language).toBe("en");
 expect(mockSetNativeLanguage).toHaveBeenLastCalledWith("en");
});
it("keeps placeholders and Turkish counters intact",()=>{
 expect(new Set(Object.keys(en))).toEqual(new Set(Object.keys(tr)));
 for(const [key,value] of Object.entries(en))expect([...value.matchAll(/\{\{([^}]+)\}\}/g)].map(x=>x[1]).sort()).toEqual([...tr[key as keyof typeof tr].matchAll(/\{\{([^}]+)\}\}/g)].map(x=>x[1]).sort());
 useInterfaceLanguageStore.getState().setLanguage("tr");expect(widgetUiLabel("1 available")).toBe("1 tekrar hazır");expect(widgetUiLabel("12 available")).toBe("12 tekrar hazır");
 const key=Object.keys(en).find(k=>en[k as keyof typeof en]==="{{value1}} question{{value2}} selected") as keyof typeof en;
 expect(uiT(key,{value1:5,value2:"s"})).toBe("5 soru seçildi");
});
it("formats interface numbers/dates without changing protocol values",()=>{
 useInterfaceLanguageStore.getState().setLanguage("tr");expect(formatUiNumber(1234.5)).toBe("1.234,5");
 expect(formatUiDate(new Date(2026,9,12),{month:"long"})).toBe("Ekim");
 expect(widgetUiLabel("橋")).toBe("橋");
});
