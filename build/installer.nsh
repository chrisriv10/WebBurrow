!ifndef BUILD_UNINSTALLER
  !include "StrFunc.nsh"
  ${StrRep}
!endif

!macro customInstall
  CreateDirectory "$LOCALAPPDATA\WebBurrow"
  ${StrRep} $1 "$INSTDIR\WebBurrow.exe" "\" "/"
  FileOpen $0 "$LOCALAPPDATA\WebBurrow\native-messaging-host.json" w
  FileWrite $0 '{"name":"com.webburrow.desktop","description":"WebBurrow local browser bridge","path":"$1","type":"stdio","allowed_origins":["chrome-extension://igfepplhdmogifjmgfligakhgoacflhg/"]}'
  FileClose $0
  WriteRegStr HKCU "Software\Google\Chrome\NativeMessagingHosts\com.webburrow.desktop" "" "$LOCALAPPDATA\WebBurrow\native-messaging-host.json"
  WriteRegStr HKCU "Software\Microsoft\Edge\NativeMessagingHosts\com.webburrow.desktop" "" "$LOCALAPPDATA\WebBurrow\native-messaging-host.json"
  WriteRegStr HKCU "Software\BraveSoftware\Brave-Browser\NativeMessagingHosts\com.webburrow.desktop" "" "$LOCALAPPDATA\WebBurrow\native-messaging-host.json"
  WriteRegStr HKCU "Software\Classes\webburrow" "" "URL:webburrow"
  WriteRegStr HKCU "Software\Classes\webburrow" "URL Protocol" ""
  WriteRegStr HKCU "Software\Classes\webburrow\DefaultIcon" "" "$INSTDIR\WebBurrow.exe,0"
  WriteRegStr HKCU "Software\Classes\webburrow\shell\open\command" "" '"$INSTDIR\WebBurrow.exe" "%1"'
!macroend

!macro customUnInstall
  DeleteRegKey HKCU "Software\Google\Chrome\NativeMessagingHosts\com.webburrow.desktop"
  DeleteRegKey HKCU "Software\Microsoft\Edge\NativeMessagingHosts\com.webburrow.desktop"
  DeleteRegKey HKCU "Software\BraveSoftware\Brave-Browser\NativeMessagingHosts\com.webburrow.desktop"
  DeleteRegKey HKCU "Software\Classes\webburrow"
  Delete "$LOCALAPPDATA\WebBurrow\native-messaging-host.json"
  RMDir "$LOCALAPPDATA\WebBurrow"
!macroend
