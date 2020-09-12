
function HeaderProfileContainer(prop){
	const { HeaderProfile, Bootstrap, store } = ReactSteedos;
	const Provider = ReactRedux.Provider;
	return (
		<Provider store={store}>
			<Bootstrap>
				<HeaderProfile avatarURL={prop.avatarURL} logoutAccountClick={prop.logoutAccountClick} settingsAccountClick={prop.settingsAccountClick} footers={prop.footers} assistiveText={prop.assistiveText}/>
			</Bootstrap>
		</Provider>
	)
}

export default HeaderProfileContainer;