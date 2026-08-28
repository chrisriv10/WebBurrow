!macro customInstall
  CreateDirectory "$LOCALAPPDATA\WebBurrow"
  FileOpen $0 "$LOCALAPPDATA\WebBurrow\native-messaging-host.json" w
  FileWrite $0 '{"name":"com.webburrow.desktop","description":"WebBurrow local browser bridge","path":"$INSTDIR/WebBurrow.exe","type":"stdio","allowed_origins":["chrome-extension://igfepplhdmogifjmgfligakhgoacflhg/"]}'
  FileClose $0
  WriteRegStr HKCU "Software\Google\Chrome\NativeMessagingHosts\com.webburrow.desktop" "" "$LOCALAPPDATA\WebBurrow\native-messaging-host.json"
  WriteRegStr HKCU "Software\Microsoft\Edge\NativeMessagingHosts\com.webburrow.desktop" "" "$LOCALAPPDATA\WebBurrow\native-messaging-host.json"
  WriteRegStr HKCU "Software\BraveSoftware\Brave-Browser\NativeMessagingHosts\com.webburrow.desktop" "" "$LOCALAPPDATA\WebBurrow\native-messaging-host.json"
!macroend

!macro customUnInstall
  DeleteRegKey HKCU "Software\Google\Chrome\NativeMessagingHosts\com.webburrow.desktop"
  DeleteRegKey HKCU "Software\Microsoft\Edge\NativeMessagingHosts\com.webburrow.desktop"
  DeleteRegKey HKCU "Software\BraveSoftware\Brave-Browser\NativeMessagingHosts\com.webburrow.desktop"
  Delete "$LOCALAPPDATA\WebBurrow\native-messaging-host.json"
!macroend
