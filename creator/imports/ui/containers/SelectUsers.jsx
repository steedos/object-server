
function SelectUsersContainer(prop){
	const { SelectUsers, Bootstrap, store } = ReactSteedos;
	const Provider = ReactRedux.Provider;
	return (
		<Provider store={store}>
			<Bootstrap>
				<SelectUsers searchMode="omitFilters" multiple={prop.multiple} gridId={prop.gridId} />
			</Bootstrap>
		</Provider>
	)
}

export default SelectUsersContainer;