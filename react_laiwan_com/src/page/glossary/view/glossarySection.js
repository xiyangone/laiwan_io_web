import React from 'react';
import { Link } from 'react-router-dom';

const GlossarySection = ({
    searchText, terms, getChars, selectedLetter, locale, styles,
}) => {
    const filter = (set) => {
        const filteredArray = Object.entries(set)
            .filter(
                (item) => `${item[0].toString().toLowerCase()} ${item[1].name.toString().toLowerCase()}`
                    .includes(
                        searchText.toString().toLowerCase(),
                    ),
            );
        const filteredObject = filteredArray.reduce((a, v) => ({ ...a, [v[0]]: v[1] }), {});
        return filteredObject;
    };

    const glossaryItems = searchText !== ''
        ? filter(terms)
        : terms;

    const glossaryChars = getChars(glossaryItems);
    return (
        <div className={styles.glossaryTable}>
            {
                Object.values(glossaryChars).map((character) => (
                    <div
                        key={`glossary-${character}`}
                        className={styles.glossaryGroup}
                        id={`group-${character}`}
                        style={selectedLetter === character
                            ? { boxShadow: '0px 0px 5px 2px #555555' }
                            : {}}
                    >
                        <h2 className={styles.glossaryCharacter}>{character}</h2>
                        <ul className={styles.glossaryList}>
                            {
                                Object.entries(glossaryItems).map(([key, value]) => {
                                    if (key.toString()[0].toUpperCase() === character) {
                                        return (
                                            <li
                                                key={`glossaryListItem-${key}`}
                                                className={styles.glossaryListItem}
                                            >
                                                <Link to={`/glossary/${locale}/${key}`} className={styles.link}>
                                                    <p className={styles.linkText}>{value.name}</p>
                                                </Link>
                                            </li>
                                        );
                                    }
                                    return (<div/>);
                                })
                            }
                        </ul>
                    </div>
                ))
            }
        </div>
    );
};

export default GlossarySection;
