import spacy
nlp = spacy.load("en_core_web_sm")
doc = nlp("Python Laravel React SQL")
print([token.text for token in doc])
